import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import "@/features/training/components/training-workspace.css";
import "@/features/training/components/training-today.css";
import "@/features/nutrition/components/nutrition-workspace.css";
import "@/features/foods/components/food-library.css";
import "@/features/training/components/exercise-library.css";
import { EmptyState } from "@/components/shared/empty-state";
import { TrainingToday } from "@/features/training/components/training-today";
import { TrainingHistory } from "@/features/training/components/training-history";
import { Section } from "@/components/shared/section";
import { CreatePlanDialog } from "@/features/training/components/create-plan-dialog";
import { ImportRoutineDialog } from "@/features/training/components/import-routine-dialog";
import { PlanCard } from "@/features/training/components/plan-card";
import { ExerciseLibrary } from "@/features/training/components/exercise-library";
import {
  COLECCIONES,
  grupoDe,
  type Coleccion,
} from "@/features/training/lib/library-groups";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  getExerciseLibrary,
  getTrainingLog,
  getTrainingOverview,
} from "@/features/training/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export const metadata: Metadata = { title: t.title };

/* Cuatro pestañas, en la URL para que se puedan enlazar y para que «atrás»
   vuelva a la anterior. El historial va aparte porque es otra pregunta:
   «Hoy» es qué voy a hacer; «Historial», qué hice y con cuánto peso. La
   biblioteca es el catálogo entero, para explorar o aprender un ejercicio. */
const VISTAS = [
  { id: "hoy", label: "Hoy" },
  { id: "historial", label: "Historial" },
  { id: "rutinas", label: "Rutinas" },
  { id: "biblioteca", label: "Biblioteca" },
] as const;
type Vista = (typeof VISTAS)[number]["id"];

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    q?: string;
    grupo?: string;
    equipo?: string;
    coleccion?: string;
    pagina?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const pedida = params.vista;
  const vista: Vista = VISTAS.some((v) => v.id === pedida)
    ? (pedida as Vista)
    : "hoy";

  const grupo = grupoDe(params.grupo);
  const coleccion: Coleccion = COLECCIONES.some(
    (c) => c.id === params.coleccion,
  )
    ? (params.coleccion as Coleccion)
    : "todos";
  const biblioteca = {
    q: params.q?.trim().slice(0, 80) || undefined,
    grupo: grupo?.id,
    equipo: params.equipo || undefined,
    coleccion,
    pagina: Math.max(1, Number(params.pagina) || 1),
  };

  const [overview, log, library] = await Promise.all([
    getTrainingOverview(user.id),
    vista === "historial" ? getTrainingLog(user.id) : Promise.resolve(null),
    vista === "biblioteca"
      ? getExerciseLibrary(user.id, {
          query: biblioteca.q,
          muscles: grupo?.catalogo,
          equipment: biblioteca.equipo,
          collection: coleccion,
          page: biblioteca.pagina,
        })
      : Promise.resolve(null),
  ]);

  // Proximo dia del plan activo: el siguiente al de la ultima sesion.
  const activeDays = overview.activePlan?.days ?? [];
  let nextDay = activeDays[0] ?? null;
  const lastDayId = overview.recentSessions[0]?.planDayId;
  if (lastDayId) {
    const lastIndex = activeDays.findIndex((day) => day.id === lastDayId);
    if (lastIndex >= 0) {
      nextDay = activeDays[(lastIndex + 1) % activeDays.length] ?? nextDay;
    }
  }

  return (
    <div className="training-workspace">
      <header className="training-header">
        <div className="training-brand">
          <BrandLogo variant="mark" height={38} />
          <div>
            <h1>Entrenamiento</h1>
            <p>Tu rutina. Tu ritmo. Tu progreso.</p>
          </div>
        </div>
      </header>
      <nav className="training-tabs" aria-label="Secciones de entrenamiento">
        {VISTAS.map((v) => (
          <Link
            key={v.id}
            href={
              v.id === "hoy" ? "/entrenamiento" : `/entrenamiento?vista=${v.id}`
            }
            aria-current={vista === v.id ? "page" : undefined}
            scroll={false}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {vista === "hoy" && (
        <TrainingToday overview={overview} initialDayId={nextDay?.id} />
      )}

      {vista === "historial" && log && (
        <TrainingHistory sessions={log} muscleSets7d={overview.muscleSets7d} />
      )}

      {vista === "biblioteca" && library && (
        <ExerciseLibrary params={biblioteca} {...library} />
      )}

      {vista === "rutinas" && (
        <Section
          variant="plain"
          title={t.plansSection}
          action={
            <span className="flex flex-wrap items-center gap-2">
              <ImportRoutineDialog />
              <CreatePlanDialog />
            </span>
          }
        >
          {overview.plans.length > 0 ? (
            /* Lista, no rejilla: las rutinas son una secuencia, y la de dos
             columnas dejaba la activa compitiendo con una vecina. */
            <div className="training-routine-grid">
              {[...overview.plans]
                .sort((a, b) => Number(b.active) - Number(a.active))
                .map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
            </div>
          ) : (
            <EmptyState
              title={t.noPlans}
              description="Tus rutinas guardadas aparecerán aquí."
              icon={Dumbbell}
            />
          )}
        </Section>
      )}
    </div>
  );
}
