import { createClient } from "@/lib/supabase/server";
import {
  movingAverage,
  trendDirection,
  windowDifference,
  type DatedValue,
  type TrendDirection,
} from "@/lib/trends";
import type { MeasurementSource, PhotoView } from "@/features/progress/schemas";

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

export type ProgressData = {
  measurements: MeasurementView[];
  weightSeries: DatedValue[];
  weightAverage7: DatedValue[];
  lastWeight: number | null;
  weeklyChange: number | null;
  monthlyChange: number | null;
  trend: TrendDirection | null;
  photos: PhotoViewItem[];
};

const numberOrNull = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

export async function getProgressData(userId: string): Promise<ProgressData> {
  const supabase = await createClient();

  const [measurementsResult, photosResult] = await Promise.all([
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
  ]);

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

  return {
    measurements,
    weightSeries,
    weightAverage7: movingAverage(weightSeries, 7),
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
