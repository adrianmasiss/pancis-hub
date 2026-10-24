"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EvidenceConstant } from "@/features/evidence/queries";
import { formatValue, formulaLabel } from "@/lib/evidence/format-value";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.evidence;

/** El rol de una fuente no es decorativo: una que matiza no se lee igual. */
const ROLE_TONE: Record<string, string> = {
  sustenta: "text-positive",
  matiza: "text-caution",
  contradice: "text-critical",
};

/**
 * Una constante del plan: la segunda capa.
 *
 * Lo que la hace util es el par valor + porque, y lo que la hace honesta es la
 * marca de `is_product_parameter`: siete de las veintiuna NO salen de un
 * estudio, son criterio del producto. Mezclarlas con las demas sin decirlo
 * seria presentar una decision como evidencia.
 */
export function ConstantRow({ constant }: { constant: EvidenceConstant }) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(
    constant.rationale || constant.limitations || constant.sources.length > 0,
  );

  return (
    <li className="border-hairline border-b last:border-b-0">
      <div className="flex flex-col gap-2 py-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {constant.isProductParameter ? (
            <span className="text-caution label-micro border-caution/40 rounded-full border px-2 py-0.5">
              {t.productParameter}
            </span>
          ) : constant.evidenceGrade ? (
            <span className="text-positive label-micro">
              {t.grade(constant.evidenceGrade)}
            </span>
          ) : null}
          <span className="text-subtle-foreground label-micro">
            {constant.sources.length > 0
              ? t.sourcesCount(constant.sources.length)
              : t.noSources}
          </span>
        </div>

        {formulaLabel(constant.key) ? (
          <p className="text-[15px] font-medium">
            {formulaLabel(constant.key)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {/* La clave se muestra tal cual: es el identificador real con el que
              el asistente y el calculo la nombran, y renombrarla aqui haria
              imposible cruzar lo que dice la app con lo que dice la base. */}
          <span className="num text-[14px] font-medium">{constant.key}</span>
          <span className="num-strong">
            {formatValue(constant.value, constant.key)}
          </span>
          {constant.unit ? (
            <span className="text-muted-foreground text-[13px]">
              {constant.unit}
            </span>
          ) : null}
        </div>

        {hasDetail ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex w-fit items-center gap-1.5 rounded-sm text-[13px] font-medium transition-colors outline-none focus-visible:ring-2"
          >
            {open ? t.detailHide : t.detail}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-[var(--dur-base)]",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        ) : null}

        {open ? (
          <div className="flex flex-col gap-3 pt-1">
            {constant.isProductParameter ? (
              <p className="text-caution text-[14px] leading-[1.6] text-pretty">
                {t.productParameterNote}
              </p>
            ) : null}

            {constant.rationale ? (
              <p className="text-[14px] leading-[1.6] text-pretty">
                {constant.rationale}
              </p>
            ) : null}

            {constant.limitations ? (
              <div>
                <p className="text-subtle-foreground label-micro">
                  {t.limitations}
                </p>
                <p className="text-muted-foreground mt-1 text-[14px] leading-[1.6] text-pretty">
                  {constant.limitations}
                </p>
              </div>
            ) : null}

            {constant.sources.length > 0 ? (
              <ul className="divide-hairline flex flex-col divide-y">
                {constant.sources.map((source) => (
                  <li
                    key={`${source.title}-${source.role}`}
                    className="flex flex-col gap-1 py-2.5"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          "label-micro",
                          ROLE_TONE[source.role] ?? "text-subtle-foreground",
                        )}
                      >
                        {t.roles[source.role] ?? source.role}
                      </span>
                      {source.evidenceGrade ? (
                        <span className="text-subtle-foreground label-micro">
                          {t.grade(source.evidenceGrade)}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[14px] leading-[1.45] text-pretty">
                      {source.title}
                      {source.year ? (
                        <span className="text-muted-foreground num">
                          {" "}
                          {source.year}
                        </span>
                      ) : null}
                    </span>
                    {/* La nota del revisor es lo que separa "nivel A" de lo
                        que ese nivel A dice sobre ESTA cifra. */}
                    {source.note ? (
                      <span className="text-muted-foreground text-[13px] leading-[1.6] text-pretty">
                        {source.note}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
