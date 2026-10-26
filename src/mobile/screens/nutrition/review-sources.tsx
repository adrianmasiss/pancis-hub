"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { ReviewItem } from "@/features/foods/source-queries";
import {
  formatDivergence,
  macroDisagreements,
  readingLabel,
  sourceName,
  type SourceReading,
} from "@/features/foods/lib/source-agreement";
import { resolveWithSource } from "@/features/foods/review-actions";
import { triggerHaptic } from "@/lib/haptics";
import { FormScreen } from "@/mobile/ui/form-screen";

const numero = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(n);

/**
 * Fuentes que no coinciden, en el telefono: una tarjeta por alimento con lo
 * que dice cada proveedor en filas comparables, y un boton por fuente. La
 * misma accion que escritorio; el porque, plegado arriba.
 */
export function ReviewSourcesMobile({
  items,
  threshold,
  back,
}: {
  items: ReviewItem[];
  threshold: number;
  back: string;
}) {
  return (
    <FormScreen title="Revisar fuentes" back={back} backLabel="Volver">
      <details className="m-form-note m-why">
        <summary>Por qué aparecen aquí</summary>
        <p>
          Cuando dos fuentes describen el mismo alimento, tu biblioteca guarda
          el valor de la más fiable. <strong>Nunca se promedian.</strong> Estos
          difieren más de un {threshold} %; casi siempre es que alguien escribió
          el valor por porción en la casilla de por 100 g.
        </p>
        <p>
          Lo que elijas vale solo para ti: el catálogo compartido no se toca.
        </p>
      </details>

      {items.length ? (
        <ul className="m-review-list">
          {items.map((item) => (
            <ReviewCard key={item.foodId} item={item} />
          ))}
        </ul>
      ) : (
        <div className="m-empty">
          <ShieldCheck size={32} strokeWidth={1.4} aria-hidden="true" />
          <p>
            Ninguna fuente se contradice: todo concuerda dentro del {threshold}{" "}
            %.
          </p>
        </div>
      )}
    </FormScreen>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resuelto, setResuelto] = useState<string | null>(null);
  const readings = item.agreement.readings;
  const canonica = readings[0];
  const peor =
    canonica && readings[1] ? macroDisagreements(canonica, readings[1]) : [];

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
      triggerHaptic("success");
      setResuelto(sourceName(reading.source));
      router.refresh();
    });

  return (
    <li className="m-card m-review-card">
      <header>
        <span>
          <strong>{item.name}</strong>
          {item.brand && <small>{item.brand}</small>}
        </span>
        <span className="m-tag" data-tone="warn">
          difieren {formatDivergence(item.maxDivergencePct)}
        </span>
      </header>

      <table className="m-review-table">
        <thead>
          <tr>
            <th scope="col">Fuente</th>
            <th scope="col">kcal</th>
            <th scope="col">P</th>
            <th scope="col">C</th>
            <th scope="col">G</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r, i) => (
            <tr
              key={`${r.source}-${r.externalId}`}
              data-canonical={i === 0 ? "" : undefined}
            >
              <th scope="row">
                {readingLabel(r, readings)}
                {i === 0 && <small>la que usas</small>}
              </th>
              <td>{numero(r.calories)}</td>
              <td>{numero(r.proteinG)}</td>
              <td>{numero(r.carbohydrateG)}</td>
              <td>{numero(r.fatG)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {peor[0] && (
        <p className="m-field-hint">
          El mayor desacuerdo está en {peor[0].label.toLowerCase()}:{" "}
          {numero(peor[0].canonical)} {peor[0].unit} contra{" "}
          {numero(peor[0].other)} {peor[0].unit}.
        </p>
      )}

      {resuelto ? (
        <p className="m-review-done">
          <Check size={15} aria-hidden="true" /> Tu biblioteca usa el valor de{" "}
          {resuelto}.
        </p>
      ) : (
        <div className="m-review-actions">
          {readings.map((r, i) => (
            <button
              key={`${r.source}-${r.externalId}`}
              type="button"
              className="m-btn m-press"
              data-variant={i === 0 ? undefined : "primary"}
              disabled={pending}
              onClick={() => resolver(r)}
            >
              Usar {readingLabel(r, readings)}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
