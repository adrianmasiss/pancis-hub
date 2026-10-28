import {
  getExerciseLibrary,
  getPlanDetail,
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
import { nextPlanDay } from "./week-data";
import {
  GRUPOS_MUSCULARES,
  grupoDe,
} from "@/features/training/lib/library-groups";

export type TrainingParams = {
  vista?: string;
  paso?: string;
  ejercicio?: string;
  q?: string;
  pagina?: string;
  filtro?: string;
  /** Grupo muscular de la biblioteca (`GRUPOS_MUSCULARES`). */
  grupo?: string;
  /** Secundarios elegidos para ese grupo, separados por coma. */
  sec?: string;
};

/** Dos minutos: lo justo para volver de «Empezar entrenamiento». */
function startedRecently(iso: string): boolean {
  return Date.now() - Date.parse(iso) < 2 * 60 * 1000;
}

/** Titulo de cada seccion: el mismo criterio que Nutricion. */
const TITULOS = {
  hoy: { title: "Entrenar", subtitle: "" },
  rutinas: { title: "Rutinas", subtitle: "Las del coach y las creadas por IA" },
  historial: { title: "Historial", subtitle: "Lo que entrenaste, día por día" },
  biblioteca: { title: "Biblioteca", subtitle: "Ejercicios con su técnica" },
} as const;

/** Ids de los ejercicios favoritos del usuario. */
async function favoriteIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_favorites")
    .select("exercise_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((f) => f.exercise_id));
}

/**
 * Por grupo muscular, los secundarios que trabajan sus ejercicios, los mas
 * comunes primero (sin los del propio grupo ni los que casi no aparecen).
 */
async function secondaryByGroup(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  // En tandas: la API devuelve a lo sumo mil filas por consulta.
  const data: { primary_muscle: string; secondary_muscles: string[] | null }[] =
    [];
  for (let desde = 0; ; desde += 1000) {
    const { data: tanda } = await supabase
      .from("exercise_catalog")
      .select("primary_muscle, secondary_muscles")
      .is("deleted_at", null)
      .order("id")
      .range(desde, desde + 999);
    data.push(...(tanda ?? []));
    if (!tanda || tanda.length < 1000) break;
  }
  const porGrupo: Record<string, string[]> = {};
  for (const g of GRUPOS_MUSCULARES) {
    const propios = g.catalogo as readonly string[];
    const cuenta = new Map<string, number>();
    for (const fila of data) {
      if (!propios.includes(fila.primary_muscle)) continue;
      for (const m of fila.secondary_muscles ?? []) {
        if (!propios.includes(m)) cuenta.set(m, (cuenta.get(m) ?? 0) + 1);
      }
    }
    porGrupo[g.id] = [...cuenta]
      .filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m);
  }
  return porGrupo;
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

  // El dia que toca por orden: el primero que falta esta semana.
  const days = overview.activePlan?.days ?? [];
  const nextDay = nextPlanDay(
    days,
    overview.doneThisWeek,
    overview.recentSessions[0]?.planDayId,
  );

  // Los dias de cada rutina, para desplegarlos ahi mismo en Rutinas. Son
  // pocas.
  const loadPlanDays = async () => {
    const detalles = await Promise.all(
      overview.plans.map((p) =>
        p.id === overview.activePlan?.id
          ? overview.activePlan
          : getPlanDetail(userId, p.id, today),
      ),
    );
    return Object.fromEntries(
      detalles.flatMap((d) => (d ? [[d.id, d.days] as const] : [])),
    );
  };

  let body: React.ReactNode;
  if (tab === "rutinas") {
    const planDays = await loadPlanDays();
    const ids = Object.values(planDays).flatMap((ds) =>
      ds.flatMap((d) => d.exercises.map((e) => e.exerciseId)),
    );
    body = (
      <Routines
        plans={overview.plans}
        planDays={planDays}
        images={await exerciseImages([...new Set(ids)])}
        todayDayId={nextDay?.id ?? null}
        aiEnabled={aiEnabled}
      />
    );
  } else if (tab === "historial") {
    const log = await getTrainingLog(userId);
    body = <TrainingHistory sessions={log} today={today} timezone={timezone} />;
  } else if (tab === "biblioteca") {
    const page = Math.max(1, Number(params.pagina) || 1);
    const favoritos = params.filtro === "favoritos";
    const favs = await favoriteIds(userId);
    const grupo = grupoDe(params.grupo);
    const musculos: string[] | undefined = grupo
      ? [...grupo.catalogo]
      : undefined;
    const secundarios = grupo
      ? (params.sec ?? "")
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];
    const library = await getExerciseLibrary(userId, {
      query: params.q?.trim().slice(0, 80) || undefined,
      muscles: musculos,
      secondaryMuscles: secundarios.length ? secundarios : undefined,
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
      if (musculos) {
        exercises = exercises.filter(
          (e) =>
            musculos.includes(e.primaryMuscle) &&
            (secundarios.length === 0 ||
              e.secondaryMuscles.some((m) => secundarios.includes(m))),
        );
      }
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
        group={grupo?.id ?? null}
        secondary={secundarios}
        secondaryByGroup={await secondaryByGroup()}
      />
    );
  } else {
    /* Sin la fecha de hoy, la rutina llega tal cual esta guardada: editarla
       no debe volver permanente un cambio de «solo hoy». */
    const routine = overview.activePlan
      ? await getPlanDetail(userId, overview.activePlan.id, "1970-01-01")
      : null;
    const ids = (routine?.days ?? []).flatMap((d) =>
      d.exercises.map((e) => e.exerciseId),
    );
    body = (
      <TrainingToday
        overview={overview}
        today={today}
        timezone={timezone}
        nextDayId={nextDay?.id ?? null}
        routine={routine}
        images={await exerciseImages([...new Set(ids)])}
      />
    );
  }

  return (
    <TrainingTabs
      active={tab}
      title={TITULOS[tab].title}
      subtitle={
        tab === "hoy"
          ? (overview.activePlan?.name ?? "Sin rutina activa")
          : TITULOS[tab].subtitle
      }
    >
      {body}
    </TrainingTabs>
  );
}
