import Link from "next/link";
import { BadgeCheck, TriangleAlert } from "lucide-react";
import {
  agreementVerdict,
  formatDivergence,
  listSources,
  type SourceAgreement,
} from "@/features/foods/lib/source-agreement";

/**
 * El sello de fuentes de un alimento.
 *
 * Es el único sitio donde «ningún número sin fuente» deja de ser una promesa
 * del documento y se vuelve algo que se ve. Dos proveedores que miden lo mismo
 * y coinciden valen más que uno solo, y decirlo con el porcentaje delante es
 * lo que lo hace comprobable: «corroborado» a secas sería una palabra bonita.
 *
 * No se dibuja nada cuando hay una sola medición. Un sello que apareciera
 * siempre dejaría de significar algo.
 *
 * El color nunca va solo: el estado se lee en el texto, porque un filete rojo
 * no dice qué pasa ni se ve igual para todo el mundo.
 */
export function SourceSeal({
  agreement,
}: {
  agreement: SourceAgreement | null;
}) {
  const verdict = agreementVerdict(agreement);
  if (verdict.kind === "sola") return null;

  const otras = listSources(verdict.others);
  if (verdict.kind === "corroborado")
    return (
      <p className="source-seal" data-state="corroborado">
        <BadgeCheck size={14} aria-hidden="true" />
        {/* Sin porcentaje no se calla el sello: una divergencia nula quiere
            decir que ningún macro llegó a la diferencia mínima, o sea que
            coinciden. Inventar un «0 %» sería afirmar más de lo medido. */}
        <span>
          {verdict.divergencePct === null
            ? `Corroborado por ${otras} · coinciden`
            : `Corroborado por ${otras} · difieren ${formatDivergence(
                verdict.divergencePct,
              )}`}
        </span>
      </p>
    );

  return (
    <p className="source-seal" data-state="discrepa">
      <TriangleAlert size={14} aria-hidden="true" />
      {/* La frase va en una sola expresión: partida en varios hijos de JSX,
          el punto final acababa en su propia línea y se leía «63 % .» */}
      <span>
        {`${otras} no coincide · difieren ${formatDivergence(
          verdict.divergencePct,
        )}.`}{" "}
        <Link href="/nutricion/alimentos/revisar">Revisar</Link>
      </span>
    </p>
  );
}
