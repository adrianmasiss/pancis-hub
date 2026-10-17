"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EvidenceStudy } from "@/features/evidence/queries";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.evidence;

/**
 * Un estudio de la primera capa.
 *
 * Plegado dice lo que permite juzgarlo: titulo, ano, revista, tipo y grado. La
 * poblacion y las limitaciones se despliegan, porque son lo que decide si ese
 * estudio te aplica a TI y ocupan mas de una linea.
 *
 * La poblacion no es un detalle escondido por gusto: es lo primero que separa
 * "nivel A" de "nivel A sobre gente que no se parece a ti".
 */
export function StudyRow({ study }: { study: EvidenceStudy }) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(study.population || study.limitations);

  return (
    <li className="border-hairline border-b last:border-b-0">
      <div className="flex flex-col gap-2 py-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-subtle-foreground label-micro">
            {t.sourceTypes[study.sourceType] ?? study.sourceType}
          </span>
          {study.evidenceGrade ? (
            <span className="text-positive label-micro">
              {t.grade(study.evidenceGrade)}
            </span>
          ) : null}
          {study.isOpenAccess ? (
            <span className="text-subtle-foreground label-micro">
              {t.openAccess}
            </span>
          ) : null}
        </div>

        <p className="text-[15px] leading-[1.45] font-medium text-pretty">
          {study.title}
        </p>

        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          {study.authors ? <span>{study.authors}</span> : null}
          {study.year ? <span className="num">{study.year}</span> : null}
          {study.journal ? (
            <span className="italic">{study.journal}</span>
          ) : null}
          {study.identifier ? (
            <span className="num text-subtle-foreground">
              {study.identifier}
            </span>
          ) : null}
        </p>

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
          <dl className="flex flex-col gap-3 pt-1">
            {study.population ? (
              <div>
                <dt className="text-subtle-foreground label-micro">
                  {t.population}
                </dt>
                <dd className="mt-1 text-[14px] leading-[1.6] text-pretty">
                  {study.population}
                </dd>
              </div>
            ) : null}
            {study.limitations ? (
              <div>
                <dt className="text-subtle-foreground label-micro">
                  {t.limitations}
                </dt>
                <dd className="text-muted-foreground mt-1 text-[14px] leading-[1.6] text-pretty">
                  {study.limitations}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </li>
  );
}
