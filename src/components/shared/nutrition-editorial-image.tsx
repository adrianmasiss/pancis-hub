import Image from "next/image";
import { cn } from "@/lib/utils";

export function NutritionEditorialImage({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <figure
      className={cn(
        "border-hairline relative overflow-hidden border bg-[#0c100e]",
        className,
      )}
    >
      <Image
        src="/images/nutrition-editorial.png"
        alt="Avena con frutos rojos y yogur sobre piedra oscura"
        fill
        sizes="(max-width: 1023px) 100vw, 28vw"
        className={cn("nutrition-photo object-cover", imageClassName)}
      />
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1210]/35 via-transparent to-transparent"
        aria-hidden="true"
      />
    </figure>
  );
}
