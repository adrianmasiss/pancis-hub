import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EvidenceLayer } from "@/features/evidence/components/evidence-layer";
import { EvidenceRing } from "@/features/evidence/components/evidence-ring";
import { StudyRow } from "@/features/evidence/components/study-row";
import { ConstantRow } from "@/features/evidence/components/constant-row";
import { getEvidenceLibrary } from "@/features/evidence/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.evidence;
const d = messages.dashboard.nutrition;

export const metadata: Metadata = { title: t.title };

/**
 * Evidencia: la biblioteca de contexto del handoff, en sus tres capas.
 *
 * El handoff dibuja las siete fuentes como lomos en un anillo 3D que gira. El
 * anillo no esta aqui todavia, y el propio handoff exige alternativa tabular
 * OBLIGATORIA para cualquier visualizacion 3D: esto es esa alternativa, que es
 * la parte que de verdad comunica. El anillo va encima despues, no debajo.
 *
 * Las tres capas salen de datos reales, no de contenido de muestra:
 * `research_sources`, `formula_versions` con su union, y los objetivos del
 * propio usuario.
 */
export default async function EvidencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { studies, constants, personal, spines } = await getEvidenceLibrary(
    user.id,
  );

  const fmt = (n: number) => Math.round(n).toLocaleString("es-419");

  return (
    <div className="flex flex-col gap-12 py-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <p className="text-subtle-foreground label-micro">
          {t.eyebrow(studies.length, constants.length)}
        </p>
        <h1 className="page-display max-w-[24ch] text-balance">{t.headline}</h1>
        <p className="text-muted-foreground max-w-[62ch] text-[15px] leading-[1.65] text-pretty">
          {t.subtitle}
        </p>
      </header>

      {/* El anillo es el resumen en perspectiva; las tres capas de abajo son
          la biblioteca completa y la alternativa tabular que el handoff exige
          para cualquier visualizacion 3D. */}
      <div className="flex flex-col gap-3">
        <EvidenceRing spines={spines} />
        <p className="text-subtle-foreground mx-auto max-w-[52ch] text-center text-[12px] leading-relaxed text-pretty">
          {t.ring.note}
        </p>
      </div>

      <EvidenceLayer
        step={1}
        name={t.layers.evidence.name}
        claim={t.layers.evidence.claim}
        caveat={t.layers.evidence.caveat}
        count={t.sourcesCount(studies.length)}
      >
        <ul className="surface-card border-hairline divide-hairline flex flex-col px-5 sm:px-6">
          {studies.map((study) => (
            <StudyRow key={study.id} study={study} />
          ))}
        </ul>
      </EvidenceLayer>

      <EvidenceLayer
        step={2}
        name={t.layers.interpretation.name}
        claim={t.layers.interpretation.claim}
        caveat={t.layers.interpretation.caveat}
      >
        <ul className="surface-card border-hairline flex flex-col px-5 sm:px-6">
          {constants.map((constant) => (
            <ConstantRow key={constant.id} constant={constant} />
          ))}
        </ul>
      </EvidenceLayer>

      <EvidenceLayer
        step={3}
        name={t.layers.personal.name}
        claim={t.layers.personal.claim}
        caveat={t.layers.personal.caveat}
      >
        {personal ? (
          <div className="surface-card flex flex-col gap-4 px-5 py-5 sm:px-6">
            <p className="text-subtle-foreground label-micro">
              {t.targetsFrom(personal.effectiveFrom)}
            </p>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {[
                {
                  label: messages.nutrition.kcal,
                  value: fmt(personal.calories),
                },
                { label: d.protein, value: `${fmt(personal.proteinG)} g` },
                { label: d.carbs, value: `${fmt(personal.carbohydrateG)} g` },
                { label: d.fat, value: `${fmt(personal.fatG)} g` },
                { label: d.fiber, value: `${fmt(personal.fiberG)} g` },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <dt className="text-subtle-foreground label-micro">
                    {item.label}
                  </dt>
                  <dd className="num-strong">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="surface-card text-muted-foreground px-5 py-5 text-[15px] leading-[1.65] sm:px-6">
            {t.noTargets}
          </p>
        )}
      </EvidenceLayer>
    </div>
  );
}
