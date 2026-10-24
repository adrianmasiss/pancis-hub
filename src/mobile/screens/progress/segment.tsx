"use client";

import { useRouter } from "next/navigation";
import { Segmented } from "@/mobile/ui/controls";

/** Resumen / Fotos, en la URL para que «atras» vuelva. */
export function ProgressSegment({ active }: { active: "resumen" | "fotos" }) {
  const router = useRouter();
  return (
    <Segmented
      label="Sección de Progreso"
      tone="accent"
      value={active}
      onChange={(v) =>
        router.push(v === "fotos" ? "/progreso?vista=fotos" : "/progreso", {
          scroll: false,
        })
      }
      options={[
        { value: "resumen", label: "Resumen" },
        { value: "fotos", label: "Fotos" },
      ]}
    />
  );
}
