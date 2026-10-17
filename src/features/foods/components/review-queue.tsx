"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ScaleIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ReviewItem } from "@/features/foods/source-queries";
import type { SourceReading } from "@/features/foods/lib/source-agreement";
import {
  formatDivergence,
  macroDisagreements,
  readingLabel,
  sourceName,
} from "@/features/foods/lib/source-agreement";
import { resolveWithSource } from "@/features/foods/review-actions";

const numero = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(n);

function Lectura({
  reading,
  readings,
  canonical,
}: {
  reading: SourceReading;
  readings: SourceReading[];
  canonical: boolean;
}) {
  return (
    <div className="review-reading" data-canonical={canonical || undefined}>
      <p className="review-reading-source">
        {readingLabel(reading, readings)}
        {canonical && <span>lo que usa tu biblioteca</span>}
      </p>
      <p className="review-reading-energy">
        <strong>{numero(reading.calories)}</strong> kcal
      </p>
      <dl className="review-reading-macros">
        {(
          [
            ["Proteína", reading.proteinG],
            ["Carbos", reading.carbohydrateG],
            ["Grasas", reading.fatG],
          ] as const
        ).map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>{numero(valor)} g</dd>
          </div>
        ))}
      </dl>
      {reading.externalName && (
        <p className="review-reading-name">«{reading.externalName}»</p>
      )}
    </div>
  );
}

function ReviewCard({ item, index }: { item: ReviewItem; index: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resuelto, setResuelto] = useState<string | null>(null);
  const canonica = item.agreement.readings[0];
  const otras = item.agreement.readings.slice(1);
  const peor =
    canonica && otras[0] ? macroDisagreements(canonica, otras[0]) : [];

  const resolver = (reading: SourceReading) =>
    startTransition(async () => {
      const result = await resolveWithSource({
        foodId: item.foodId,
        source: reading.source,
        externalId: reading.externalId,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setResuelto(sourceName(reading.source));
      toast.success(
        `Tu biblioteca usa el valor de ${sourceName(reading.source)}`,
      );
      router.refresh();
    });

  return (
    <li
      className="v11-card review-card"
      style={{ "--i": index } as React.CSSProperties}
    >
      <header className="review-card-head">
        <div>
          <h3>{item.name}</h3>
          {item.brand && <p>{item.brand}</p>}
        </div>
        <span className="review-divergence">
          <ScaleIcon size={14} aria-hidden="true" />
          difieren {formatDivergence(item.maxDivergencePct)}
        </span>
      </header>

      <div className="review-readings">
        {canonica && (
          <Lectura
            reading={canonica}
            readings={item.agreement.readings}
            canonical
          />
        )}
        {otras.map((reading) => (
          <Lectura
            key={`${reading.source}-${reading.externalId}`}
            reading={reading}
            readings={item.agreement.readings}
            canonical={false}
          />
        ))}
      </div>

      {peor.length > 0 && (
        <p className="review-worst">
          El mayor desacuerdo está en{" "}
          <strong>{peor[0]!.label.toLowerCase()}</strong>:{" "}
          {numero(peor[0]!.canonical)} {peor[0]!.unit} contra{" "}
          {numero(peor[0]!.other)} {peor[0]!.unit}.
        </p>
      )}

      {resuelto ? (
        <p className="review-resolved">
          <Check size={15} aria-hidden="true" /> Tu biblioteca usa el valor de{" "}
          {resuelto}. Puedes deshacerlo desde la ficha del alimento.
        </p>
      ) : (
        <div className="review-actions">
          {item.agreement.readings.map((reading, i) => (
            <Button
              key={`${reading.source}-${reading.externalId}`}
              variant={i === 0 ? "outline" : "brand"}
              disabled={pending}
              onClick={() => resolver(reading)}
            >
              Usar el de {readingLabel(reading, item.agreement.readings)}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  return (
    <ul className="review-queue">
      {items.map((item, index) => (
        <ReviewCard key={item.foodId} item={item} index={index} />
      ))}
    </ul>
  );
}
