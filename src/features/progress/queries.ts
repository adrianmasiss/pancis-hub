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

export const SEGMENTOS = [
  "brazo_izquierdo",
  "brazo_derecho",
  "tronco",
  "pierna_izquierda",
  "pierna_derecha",
] as const;
export type SegmentKey = (typeof SEGMENTOS)[number];

/** Una fila del análisis segmental, tal cual la imprime el InBody. */
export type SegmentView = {
  segment: SegmentKey;
  leanMassKg: number | null;
  leanPercent: number | null;
  fatMassKg: number | null;
  fatPercent: number | null;
  evaluation: "bajo" | "normal" | "alto" | null;
};

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
  /** Totales que sólo da el InBody. */
  proteinKg: number | null;
  mineralKg: number | null;
  totalBodyWaterL: number | null;
  basalMetabolicRateKcal: number | null;
  inbodyScore: number | null;
  /** Análisis segmental; vacío si la medición no lo trae. */
  segments: SegmentView[];
  /** Obesidad y control de peso, tal como los da el informe. */
  bmi: number | null;
  idealWeightKg: number | null;
  weightControlKg: number | null;
  fatControlKg: number | null;
  muscleControlKg: number | null;
  waistHipRatio: number | null;
  /** Rangos normales impresos por el aparato: [min, max] por métrica. */
  referenceRanges: Record<string, [number, number]> | null;
};

export type PhotoViewItem = {
  id: string;
  /** Medicion a la que acompana; null si se subio suelta. */
  measurementId: string | null;
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

  const [
    measurementsResult,
    photosResult,
    profileResult,
    /* El orden sigue al del array: los segmentos se piden ANTES que los
       check-ins, así que aquí van antes. */
    segmentsResult,
    checkinsResult,
  ] = await Promise.all([
    supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(200),
    supabase
      .from("progress_photos")
      .select(
        "id, captured_at, view_type, notes, private_storage_path, measurement_id",
      )
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
      .from("measurement_segments")
      .select(
        "measurement_id, segment, lean_mass_kg, lean_percent, fat_mass_kg, fat_percent, evaluation",
      )
      .eq("user_id", userId),
    supabase
      .from("daily_checkins")
      .select(
        "date, sleep_hours, sleep_quality, energy, stress, soreness, mood, notes",
      )
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
      proteinKg: numberOrNull(row.protein_kg),
      mineralKg: numberOrNull(row.mineral_kg),
      totalBodyWaterL: numberOrNull(row.total_body_water_l),
      basalMetabolicRateKcal: numberOrNull(row.basal_metabolic_rate_kcal),
      inbodyScore: numberOrNull(row.inbody_score),
      bmi: numberOrNull(row.bmi),
      idealWeightKg: numberOrNull(row.ideal_weight_kg),
      weightControlKg: numberOrNull(row.weight_control_kg),
      fatControlKg: numberOrNull(row.fat_control_kg),
      muscleControlKg: numberOrNull(row.muscle_control_kg),
      waistHipRatio: numberOrNull(row.waist_hip_ratio),
      referenceRanges:
        (row.reference_ranges as Record<string, [number, number]> | null) ??
        null,
      /* El orden lo fija `SEGMENTOS`, no la base: el muñeco se lee de brazos
         a piernas y una fila que llegue en otro orden lo desordenaría. */
      segments: SEGMENTOS.map((clave) =>
        (segmentsResult.data ?? []).find(
          (seg) => seg.measurement_id === row.id && seg.segment === clave,
        ),
      )
        .filter((seg) => seg !== undefined)
        .map((seg) => ({
          segment: seg.segment as SegmentKey,
          leanMassKg: numberOrNull(seg.lean_mass_kg),
          leanPercent: numberOrNull(seg.lean_percent),
          fatMassKg: numberOrNull(seg.fat_mass_kg),
          fatPercent: numberOrNull(seg.fat_percent),
          evaluation: seg.evaluation as SegmentView["evaluation"],
        })),
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
        measurementId: photo.measurement_id,
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
    wellbeingToday:
      wellbeingRecent.find((entry) => entry.date === today) ?? null,
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
