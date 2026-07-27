import Link from "next/link";
import { cn } from "@/lib/utils";

export type SegmentedNavItem = {
  href: string;
  label: string;
  active: boolean;
};

type SegmentedNavProps = {
  items: readonly SegmentedNavItem[];
  /** Nombre accesible del grupo. */
  label: string;
  className?: string;
};

/**
 * Control segmentado cuyo estado vive en la URL (handoff v2, regla 4).
 *
 * Gemelo de <Segmented>, pero con enlaces en vez de botones: estas vistas se
 * navegan y se comparten, asi que el estado pertenece a la ruta. Al no llevar
 * "use client", las paginas que lo usan siguen renderizandose en el servidor.
 *
 * El contenedor hace scroll horizontal cuando no cabe, en lugar de envolver:
 * un segmentado partido en dos filas deja de leerse como un solo grupo.
 */
export function SegmentedNav({ items, label, className }: SegmentedNavProps) {
  return (
    <nav
      aria-label={label}
      className={cn("-mx-1 max-w-full overflow-x-auto px-1 py-1", className)}
    >
      <div className="segmented">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-[15px] py-[7px] text-[12.5px] whitespace-nowrap transition-all duration-150",
              item.active
                ? "bg-primary text-primary-foreground font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
            style={
              item.active
                ? {
                    boxShadow:
                      "0 0 16px -3px color-mix(in oklch, var(--primary) 55%, transparent), inset 0 1px 0 oklch(1 0 0 / 28%)",
                  }
                : undefined
            }
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
