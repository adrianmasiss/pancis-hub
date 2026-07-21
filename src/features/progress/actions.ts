"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadPrivateFile } from "@/lib/storage/upload-private-file";
import { messages } from "@/i18n/es-419";
import {
  measurementIdSchema,
  measurementSchema,
  photoIdSchema,
  photoMetaSchema,
  updateMeasurementSchema,
} from "@/features/progress/schemas";

const t = messages.progress;

export type ProgressActionResult = { error: string } | { success: true };

const fail: ProgressActionResult = { error: t.actionFailed };

const INBODY_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];
const INBODY_MAX_BYTES = 20 * 1024 * 1024;
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function formNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function formText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function measurementFromForm(formData: FormData) {
  return {
    measuredAt: formText(formData.get("measuredAt")) ?? "",
    source: formText(formData.get("source")) ?? "manual",
    weightKg: formNumber(formData.get("weightKg")),
    bodyFatPercentage: formNumber(formData.get("bodyFatPercentage")),
    skeletalMuscleKg: formNumber(formData.get("skeletalMuscleKg")),
    waistCm: formNumber(formData.get("waistCm")),
    hipCm: formNumber(formData.get("hipCm")),
    chestCm: formNumber(formData.get("chestCm")),
    armCm: formNumber(formData.get("armCm")),
    thighCm: formNumber(formData.get("thighCm")),
    visceralFatLevel: formNumber(formData.get("visceralFatLevel")),
    bodyWaterPercentage: formNumber(formData.get("bodyWaterPercentage")),
    notes: formText(formData.get("notes")),
  };
}

export async function saveMeasurement(
  formData: FormData,
): Promise<ProgressActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return fail;

  const raw = measurementFromForm(formData);
  const measurementId = formText(formData.get("measurementId"));
  const parsed = measurementId
    ? updateMeasurementSchema.safeParse({ ...raw, measurementId })
    : measurementSchema.safeParse(raw);
  if (!parsed.success) return fail;
  const data = parsed.data;

  // Adjunto InBody opcional, siempre en el bucket privado del usuario.
  let attachmentPath: string | undefined;
  const attachment = formData.get("attachment");
  if (attachment instanceof File && attachment.size > 0) {
    const uploaded = await uploadPrivateFile(
      supabase,
      "inbody-files",
      user.id,
      attachment,
      INBODY_MIME,
      INBODY_MAX_BYTES,
    );
    if (!uploaded) return fail;
    attachmentPath = uploaded;
  }

  const row = {
    measured_at: data.measuredAt,
    source: data.source,
    weight_kg: data.weightKg ?? null,
    body_fat_percentage: data.bodyFatPercentage ?? null,
    skeletal_muscle_kg: data.skeletalMuscleKg ?? null,
    waist_cm: data.waistCm ?? null,
    hip_cm: data.hipCm ?? null,
    chest_cm: data.chestCm ?? null,
    arm_cm: data.armCm ?? null,
    thigh_cm: data.thighCm ?? null,
    visceral_fat_level: data.visceralFatLevel ?? null,
    body_water_percentage: data.bodyWaterPercentage ?? null,
    notes: data.notes ?? null,
    ...(attachmentPath ? { attachment_storage_path: attachmentPath } : {}),
  };

  const { error } = measurementId
    ? await supabase
        .from("body_measurements")
        .update(row)
        .eq("id", measurementId)
        .eq("user_id", user.id)
    : await supabase
        .from("body_measurements")
        .insert({ ...row, user_id: user.id });
  if (error) return fail;

  revalidatePath("/progreso");
  revalidatePath("/");
  return { success: true };
}

export async function deleteMeasurement(
  input: unknown,
): Promise<ProgressActionResult> {
  const parsed = measurementIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: row } = await supabase
    .from("body_measurements")
    .select("attachment_storage_path")
    .eq("id", parsed.data.measurementId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", parsed.data.measurementId)
    .eq("user_id", user.id);
  if (error) return fail;

  if (row?.attachment_storage_path) {
    await supabase.storage
      .from("inbody-files")
      .remove([row.attachment_storage_path]);
  }
  revalidatePath("/progreso");
  revalidatePath("/");
  return { success: true };
}

export async function uploadProgressPhoto(
  formData: FormData,
): Promise<ProgressActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return fail;

  const parsed = photoMetaSchema.safeParse({
    capturedAt: formText(formData.get("capturedAt")),
    viewType: formText(formData.get("viewType")),
    notes: formText(formData.get("notes")),
  });
  const file = formData.get("file");
  if (!parsed.success || !(file instanceof File) || file.size === 0)
    return fail;

  const path = await uploadPrivateFile(
    supabase,
    "progress-photos",
    user.id,
    file,
    PHOTO_MIME,
    PHOTO_MAX_BYTES,
  );
  if (!path) return fail;

  const { error } = await supabase.from("progress_photos").insert({
    user_id: user.id,
    captured_at: parsed.data.capturedAt,
    view_type: parsed.data.viewType,
    private_storage_path: path,
    notes: parsed.data.notes ?? null,
  });
  if (error) {
    await supabase.storage.from("progress-photos").remove([path]);
    return fail;
  }
  revalidatePath("/progreso");
  return { success: true };
}

export async function deleteProgressPhoto(
  input: unknown,
): Promise<ProgressActionResult> {
  const parsed = photoIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: photo } = await supabase
    .from("progress_photos")
    .select("private_storage_path")
    .eq("id", parsed.data.photoId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!photo) return fail;

  const { error } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", parsed.data.photoId)
    .eq("user_id", user.id);
  if (error) return fail;

  await supabase.storage
    .from("progress-photos")
    .remove([photo.private_storage_path]);
  revalidatePath("/progreso");
  return { success: true };
}

/** URL firmada de corta duracion para un adjunto InBody propio. */
export async function getAttachmentUrl(
  input: unknown,
): Promise<{ error: string } | { url: string }> {
  const parsed = measurementIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data: row } = await supabase
    .from("body_measurements")
    .select("attachment_storage_path")
    .eq("id", parsed.data.measurementId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row?.attachment_storage_path) return { error: t.actionFailed };

  const { data, error } = await supabase.storage
    .from("inbody-files")
    .createSignedUrl(row.attachment_storage_path, 300);
  if (error || !data) return { error: t.actionFailed };
  return { url: data.signedUrl };
}
