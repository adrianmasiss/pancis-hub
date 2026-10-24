"use client";

import { useRouter } from "next/navigation";
import { Segmented } from "@/mobile/ui/controls";

/** Resumen / Evidencia, en la URL para que «atras» vuelva. */
export function ProgressSegment({
  active,
}: {
  active: "resumen" | "evidencia";
}) {
  const router = useRouter();
  return (
    <Segmented
      label="Sección de Progreso"
      tone="accent"
      value={active}
      onChange={(v) =>
        router.push(
          v === "evidencia" ? "/progreso?vista=evidencia" : "/progreso",
          { scroll: false },
        )
      }
      options={[
        { value: "resumen", label: "Resumen" },
        { value: "evidencia", label: "Evidencia" },
      ]}
    />
  );
}
