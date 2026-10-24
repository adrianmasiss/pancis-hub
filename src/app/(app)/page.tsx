import { redirect } from "next/navigation";
import { V11CopilotHero } from "@/features/dashboard/components/v11-copilot-hero";
import { V11IntakeCard } from "@/features/dashboard/components/v11-intake-card";
import {
  V11MacrosCard,
  type MacroItem,
} from "@/features/dashboard/components/v11-macros-card";
import {
  V11ActivityCard,
  V11SleepCard,
} from "@/features/dashboard/components/v11-activity-and-sleep";
import { ViewHeader } from "@/components/shared/view-header";
import { getDashboardData } from "@/features/dashboard/queries";
import { createClient } from "@/lib/supabase/server";
import { isPhone } from "@/lib/device";
import { HomeMobile } from "@/mobile/screens/home/home-mobile";

/**
 * Hoy, segun el lienzo "Pancis Hub v11".
 *
 * ATENCION — cifras de maqueta. Las tarjetas de Sueno,
 * Actividad y Adherencia todavia
 * llevan los numeros del lienzo dentro del propio componente: no hay consulta
 * que las alimente. Estan asi a proposito mientras se cierra el aspecto, y el
 * usuario lo sabe. Antes de que esto salga de desarrollo hay que cablearlas o
 * ponerlas en estado vacio: un peso real al lado de una masa muscular
 * inventada es un dato falso, no un relleno.
 *
 * Ingesta y Macros SI leen `getDashboardData`. Cuando no hay objetivos
 * calculados caen a las cifras del lienzo para que la pantalla no se lea
 * vacia; ese salvavidas es lo primero que se quita al cablear el resto.
 */
const MAQUETA = {
  calories: 2480,
  consumed: 2070,
  proteinG: 189,
  proteinTarget: 165,
  carbsG: 235,
  carbsTarget: 260,
  fatG: 78,
  fatTarget: 78,
  fiberG: 32,
  fiberTarget: 34,
} as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Telefono: su propia version de Hoy, con las consultas de cada modulo.
  if (await isPhone()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    return (
      <HomeMobile userId={user.id} displayName={profile?.display_name ?? ""} />
    );
  }

  const data = await getDashboardData(user.id);

  const dateFormatted = new Date()
    .toLocaleDateString("es-419", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    // El lienzo escribe "JUEVES 28 DE AGOSTO", sin coma tras el dia.
    .replace(",", "")
    .toUpperCase();

  const target = Math.round(data?.targets?.calories ?? MAQUETA.calories);
  const consumed = Math.round(data?.consumed?.calories ?? MAQUETA.consumed);
  const remaining = Math.max(0, target - consumed);
  const pct =
    target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const macros: MacroItem[] = [
    {
      key: "protein",
      label: "Proteína",
      consumed: Math.round(data?.consumed?.proteinG ?? MAQUETA.proteinG),
      target: Math.round(data?.targets?.proteinG ?? MAQUETA.proteinTarget),
    },
    {
      key: "carbs",
      label: "Carbohidrato",
      consumed: Math.round(data?.consumed?.carbohydrateG ?? MAQUETA.carbsG),
      target: Math.round(data?.targets?.carbohydrateG ?? MAQUETA.carbsTarget),
    },
    {
      key: "fat",
      label: "Grasa",
      consumed: Math.round(data?.consumed?.fatG ?? MAQUETA.fatG),
      target: Math.round(data?.targets?.fatG ?? MAQUETA.fatTarget),
    },
    {
      key: "fiber",
      label: "Fibra",
      consumed: Math.round(data?.consumed?.fiberG ?? MAQUETA.fiberG),
      target: Math.round(data?.targets?.fiberG ?? MAQUETA.fiberTarget),
    },
  ];

  // Entrada escalonada en el mismo orden visual y de lectura.
  return (
    <div className="dashboard-view flex w-full flex-col gap-6">
      <ViewHeader title="Hoy" meta={dateFormatted} />

      <div className="dashboard-grid">
        <V11CopilotHero index={0} />
        <V11ActivityCard index={1} />
        <V11MacrosCard macros={macros} index={2} />
        <V11IntakeCard
          consumed={consumed}
          target={target}
          remaining={remaining}
          pct={pct}
          index={3}
        />
        <V11SleepCard index={4} />
      </div>
    </div>
  );
}
