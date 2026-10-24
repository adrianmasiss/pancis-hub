import {
  getExerciseLibrary,
  getSessionDetail,
  getTrainingLog,
  getTrainingOverview,
} from "@/features/training/queries";
import { getCatalogExerciseDetail } from "@/features/training/actions";
import { createClient } from "@/lib/supabase/server";
import { hasGeminiApiKey } from "@/lib/ai/google";
import { TrainingTabs } from "./training-tabs";
import { TrainingToday } from "./today";
import { ActiveWorkout } from "./active-workout";
import { Routines } from "./routines";
import { ImportRoutine } from "./import-routine";
import { AiQuestionnaire } from "./ai-questionnaire";
import { TrainingHistory } from "./history";
import { ExerciseLibrary } from "./library";
import { ExerciseDetail } from "./exercise-detail";

export type TrainingParams = {
  vista?: string;
  paso?: string;
  ejercicio?: string;
  q?: string;
  pagina?: string;
  filtro?: string;
};

/** Dos minutos: lo justo para volver de «Empezar entrenamiento». */
function startedRecently(iso: string): boolean {
  return Date.now() - Date.parse(iso) < 2 * 60 * 1000;
}

/** Ids de los ejercicios favoritos del usuario. */
async function favoriteIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_favorites")
    .select("exercise_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((f) => f.exercise_id));
}

/** Foto de cada ejercicio del catalogo, por id. */
async function exerciseImages(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_catalog")
    .select("id, image_url")
    .in("id", ids);
  return Object.fromEntries(
    (data ?? [])
      .filter((r) => r.image_url)
      .map((r) => [r.id, r.image_url as string]),
  );
}

/**
 * Entrenar en telefono: una sola ruta (`/entrenamiento`) con la seccion en
 * `?vista=`, como en escritorio. Los datos y las acciones son los mismos; lo
 * que cambia es la capa visual.
 */
export async function TrainingMobile({
  userId,
  today,
  timezone,
  params,
}: {
  userId: string;
  today: string;
  timezone: string;
  params: TrainingParams;
}) {
  const vista = params.vista ?? "";
  const aiEnabled = hasGeminiApiKey();
  const overview = await getTrainingOverview(userId, { date: today, timezone });
  const enCurso = overview.sessionInProgress;

  /* La sesion en curso vive en `?vista=sesion`. Sin `vista` solo se abre
     sola si acaba de empezar (es la vuelta de «Empezar entrenamiento»): una
     sesion olvidada no debe tapar Entrenar · Hoy. */
  const recien = enCurso && startedRecently(enCurso.startedAt);
  if (enCurso && (vista === "sesion" || (!vista && recien))) {
    const session = await getSessionDetail(userId, enCurso.id);
    if (session && !session.completedAt) {
      const ids = session.plannedExercises.map((e) => e.exerciseId);
      return (
        <ActiveWorkout
          session={session}
          history={overview.history}
          images={await exerciseImages(ids)}
          backHref="/entrenamiento?vista=hoy"
          today={today}
          timezone={timezone}
          recentSessions={overview.recentSessions}
          doneThisWeek={overview.doneThisWeek}
        />
      );
    }
  }

  if (vista === "rutinas" && params.paso === "importar") {
    return <ImportRoutine aiEnabled={aiEnabled} />;
  }
  if (vista === "rutinas" && params.paso === "ia") {
    return <AiQuestionnaire aiEnabled={aiEnabled} />;
  }

  if (vista === "biblioteca" && params.ejercicio) {
    const detail = await getCatalogExerciseDetail({
      exerciseId: params.ejercicio,
    });
    if (!("error" in detail)) {
      const planned = overview.activePlan?.days
        .flatMap((d) => d.exercises)
        .find((e) => e.exerciseId === params.ejercicio);
      const images = await exerciseImages([params.ejercicio]);
      return (
        <ExerciseDetail
          detail={detail}
          planned={planned ?? null}
          history={overview.history[params.ejercicio] ?? null}
          imageUrl={images[params.ejercicio] ?? null}
          startPlanId={overview.activePlan?.id}
          startDayId={
            overview.activePlan?.days.find((d) =>
              d.exercises.some((e) => e.exerciseId === params.ejercicio),
            )?.id
          }
          sessionId={enCurso?.id ?? null}
          favorite={(await favoriteIds(userId)).has(params.ejercicio)}
        />
      );
    }
  }

  const tab =
    vista === "rutinas" || vista === "historial" || vista === "biblioteca"
      ? vista
      : "hoy";

  let body: React.ReactNode;
  if (tab === "rutinas") {
    body = <Routines plans={overview.plans} aiEnabled={aiEnabled} />;
  } else if (tab === "historial") {
    const log = await getTrainingLog(userId);
    body = <TrainingHistory sessions={log} today={today} timezone={timezone} />;
  } else if (tab === "biblioteca") {
    const page = Math.max(1, Number(params.pagina) || 1);
    const favoritos = params.filtro === "favoritos";
    const favs = await favoriteIds(userId);
    const library = await getExerciseLibrary(userId, {
      query: params.q?.trim().slice(0, 80) || undefined,
      collection: "todos",
      page: favoritos ? 1 : page,
    });
    /* Favoritos: los del usuario, leidos del catalogo por id (la consulta
       de la biblioteca no filtra por lista). */
    let exercises = library.exercises;
    let total = library.total;
    if (favoritos) {
      const supabase = await createClient();
      const { data } = favs.size
        ? await supabase
            .from("exercise_catalog")
            .select(
              "id, name, primary_muscle, secondary_muscles, equipment, instructions, is_unilateral, image_url",
            )
            .in("id", [...favs])
            .order("name")
        : { data: [] };
      exercises = (data ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        primaryMuscle: e.primary_muscle,
        secondaryMuscles: e.secondary_muscles ?? [],
        equipment: e.equipment,
        instructions: e.instructions,
        isUnilateral: e.is_unilateral,
        curated: false,
        imageUrl: e.image_url,
        inRoutine: false,
      }));
      total = exercises.length;
    }
    body = (
      <ExerciseLibrary
        exercises={exercises}
        total={total}
        query={params.q ?? ""}
        page={favoritos ? 1 : page}
        favorites={[...favs]}
        onlyFavorites={favoritos}
      />
    );
  } else {
    // Proximo dia del plan activo: el siguiente al de la ultima sesion.
    const days = overview.activePlan?.days ?? [];
    let nextDay = days[0] ?? null;
    const lastDayId = overview.recentSessions[0]?.planDayId;
    if (lastDayId) {
      const i = days.findIndex((d) => d.id === lastDayId);
      if (i >= 0) nextDay = days[(i + 1) % days.length] ?? nextDay;
    }
    body = (
      <TrainingToday
        overview={overview}
        today={today}
        timezone={timezone}
        nextDayId={nextDay?.id ?? null}
      />
    );
  }

  return (
    <TrainingTabs
      active={tab}
      subtitle={overview.activePlan?.name ?? "Sin rutina activa"}
    >
      {body}
    </TrainingTabs>
  );
}
