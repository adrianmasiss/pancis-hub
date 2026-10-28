"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { triggerHaptic } from "@/lib/haptics";
import { Haptic } from "@/mobile/ui/haptic";

export type ModuleTab = { id: string; label: string; href: string };

/**
 * Pestañas de modulo: chips horizontales de 42px con scroll. Los inactivos
 * son de vidrio; el activo, acento con halo. Van en la URL (`?vista=`) para
 * que «atras» vuelva a la anterior.
 */
export function ModuleTabs({
  label,
  tabs,
  active,
}: {
  label: string;
  tabs: readonly ModuleTab[];
  active: string;
}) {
  const ref = useRef<HTMLElement>(null);

  // El activo, a la vista: con cinco pestañas el ultimo queda fuera.
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-current="page"]');
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav ref={ref} aria-label={label} className="m-tabs">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          scroll={false}
          aria-current={t.id === active ? "page" : undefined}
          onClick={() => triggerHaptic("selection")}
          className="m-tab"
        >
          <Haptic />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
