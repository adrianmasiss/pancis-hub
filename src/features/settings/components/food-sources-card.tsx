import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { Section } from "@/components/shared/section";

/**
 * Alimentos cuyas fuentes no coinciden (USDA, Open Food Facts, Dietly dan
 * numeros distintos). Vivia como franja en la Biblioteca; el usuario pidio
 * sacarla de ahi. Aqui se queda siempre, con el conteo, para que se sepa
 * donde esta aunque no haya nada pendiente.
 */
export function FoodSourcesCard({ count }: { count: number }) {
  return (
    <Section
      title="Fuentes de alimentos"
      description="Cuando dos proveedores dan números distintos para el mismo alimento, eliges cuál vale para ti."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm">
          {count > 0 ? (
            <>
              <TriangleAlert
                className="text-destructive size-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold">{count}</strong>{" "}
                {count === 1
                  ? "alimento tiene fuentes que no coinciden."
                  : "alimentos tienen fuentes que no coinciden."}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Todas las fuentes coinciden. No hay nada que revisar.
            </span>
          )}
        </p>
        {count > 0 ? (
          <Link
            href="/nutricion/alimentos/revisar"
            className="border-border hover:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
          >
            Revisar
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </Section>
  );
}
