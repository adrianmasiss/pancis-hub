import { createClient } from "@/lib/supabase/server";
import { todayLocalISO } from "@/lib/dates";
import {
  movingAverage,
  trendDirection,
  windowDifference,
  type DatedValue,
  type TrendDirection,
} from "@/lib/trends";
import type { MeasurementSource, PhotoView } from "@/features/progress/schemas";
import {
  buildCompositionReport,
  compositionSeries,
  type CompositionReport,
  type CompositionSnapshot,
  type PrimaryGoal,
} from "@/features/progress/lib/composition";

export type MeasurementView = {
  id: string;
  measuredAt: string;
  source: MeasurementSource;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  skeletalMuscleKg: number | null;
  waistCm: number | null;
  hipCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  visceralFatLevel: number | null;
  bodyWaterPercentage: number | null;
  notes: string | null;
  hasAttachment: boolean;
};

export type PhotoViewItem = {
  id: string;
  capturedAt: string;
  viewType: PhotoView;
  notes: string | null;
  signedUrl: string | null;
};

export type WellbeingEntry = {
  date: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  energy: number | null;
  stress: number | null;
  soreness: number | null;
  mood: number | null;
  notes: string | null;
};

export type ProgressData = {
  measurements: MeasurementView[];
  weightSeries: DatedValue[];
  weightAverage7: DatedValue[];
  lastWeight: number | null;
  weeklyChange: number | null;
  monthlyChange: number | null;
  trend: TrendDirection | null;
  photos: PhotoViewItem[];
  /** Analisis de composicion corporal; null sin mediciones. */
  composition: CompositionReport | null;
  /** Evolucion de masa grasa y masa magra, para graficar. */
  fatMassSeries: DatedValue[];
  leanMassSeries: DatedValue[];
  /** Registro de bienestar de hoy, si existe. */
  wellbeingToday: WellbeingEntry | null;
  /** Ultimos registros de bienestar, del mas reciente al mas antiguo. */
  wellbeingRecent: WellbeingEntry[];
};

const numberOrNull = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

export async function getProgressData(userId: string): Promise<ProgressData> {
  const supabase = await createClient();

  const [measurementsResult, photosResult, profileResult, checkinsResult] =
    await Promise.all([
    supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(200),
    supabase
      .from("progress_photos")
      .select("id, captured_at, view_type, notes, private_storage_path")
      .eq("user_id", userId)
      .order("captured_at", { ascending: false })
      .limit(60),
    // El objetivo decide si subir de peso es favorable o no.
    supabase
      .from("profiles")
      .select("primary_goal")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("date, sleep_hours, sleep_quality, energy, stress, soreness, mood, notes")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(14),
  ]);

  const wellbeingRecent: WellbeingEntry[] = (checkinsResult.data ?? []).map(
    (row) => ({
      date: row.date,
      sleepHours: numberOrNull(row.sleep_hours),
      sleepQuality: numberOrNull(row.sleep_quality),
      energy: numberOrNull(row.energy),
      stress: numberOrNull(row.stress),
      soreness: numberOrNull(row.soreness),
      mood: numberOrNull(row.mood),
      notes: row.notes,
    }),
  );
  const today = todayLocalISO();

  const measurements: MeasurementView[] = (measurementsResult.data ?? []).map(
    (row) => ({
      id: row.id,
      measuredAt: row.measured_at,
      source: row.source as MeasurementSource,
      weightKg: numberOrNull(row.weight_kg),
      bodyFatPercentage: numberOrNull(row.body_fat_percentage),
      skeletalMuscleKg: numberOrNull(row.skeletal_muscle_kg),
      waistCm: numberOrNull(row.waist_cm),
      hipCm: numberOrNull(row.hip_cm),
      chestCm: numberOrNull(row.chest_cm),
      armCm: numberOrNull(row.arm_cm),
      thighCm: numberOrNull(row.thigh_cm),
      visceralFatLevel: numberOrNull(row.visceral_fat_level),
      bodyWaterPercentage: numberOrNull(row.body_water_percentage),
      notes: row.notes,
      hasAttachment: row.attachment_storage_path !== null,
    }),
  );

  const weightSeries: DatedValue[] = [...measurements]
    .filter((row) => row.weightKg !== null)
    .map((row) => ({ date: row.measuredAt, value: row.weightKg! }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weeklyChange = windowDifference(weightSeries, 7);
  const monthlyChange = windowDifference(weightSeries, 30);

  // URLs firmadas de corta duracion para las fotos privadas.
  const photos: PhotoViewItem[] = await Promise.all(
    (photosResult.data ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(photo.private_storage_path, 600);
      return {
        id: photo.id,
        capturedAt: photo.captured_at,
        viewType: photo.view_type as PhotoView,
        notes: photo.notes,
        signedUrl: data?.signedUrl ?? null,
      };
    }),
  );

  const snapshots: CompositionSnapshot[] = measurements.map((row) => ({
    measuredAt: row.measuredAt,
    source: row.source,
    weightKg: row.weightKg,
    bodyFatPercentage: row.bodyFatPercentage,
    skeletalMuscleKg: row.skeletalMuscleKg,
    visceralFatLevel: row.visceralFatLevel,
    bodyWaterPercentage: row.bodyWaterPercentage,
    waistCm: row.waistCm,
  }));

  return {
    measurements,
    weightSeries,
    weightAverage7: movingAverage(weightSeries, 7),
    composition: buildCompositionReport(
      snapshots,
      (profileResult.data?.primary_goal as PrimaryGoal | null) ?? null,
    ),
    fatMassSeries: compositionSeries(snapshots, "fatMassKg"),
    leanMassSeries: compositionSeries(snapshots, "leanMassKg"),
    wellbeingToday: wellbeingRecent.find((entry) => entry.date === today) ?? null,
    wellbeingRecent,
    lastWeight:
      weightSeries.length > 0
        ? weightSeries[weightSeries.length - 1]!.value
        : null,
    weeklyChange,
    monthlyChange,
    trend: trendDirection(weeklyChange),
    photos,
  };
}
