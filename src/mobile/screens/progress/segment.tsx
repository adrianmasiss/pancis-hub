"use client";

import { useRouter } from "next/navigation";
import { Segmented } from "@/mobile/ui/controls";

export type ProgressTab = "resumen" | "escaneos" | "fotos";

/** Resumen / Escaneos / Fotos, en la URL para que «atras» vuelva. */
export function ProgressSegment({ active }: { active: ProgressTab }) {
  const router = useRouter();
  return (
    <Segmented
      label="Sección de Progreso"
      tone="accent"
      value={active}
      onChange={(v) =>
        router.push(v === "resumen" ? "/progreso" : `/progreso?vista=${v}`, {
          scroll: false,
        })
      }
      options={[
        { value: "resumen", label: "Resumen" },
        { value: "escaneos", label: "Escaneos" },
        { value: "fotos", label: "Fotos" },
      ]}
    />
  );
}
