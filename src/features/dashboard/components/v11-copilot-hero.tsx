import Link from "next/link";
import { useId } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { V11Card, V11Chip } from "@/components/shared/v11-card";

type Props = {
  title?: string;
  description?: string;
  time?: string;
  proposalHref?: string;
  whyHref?: string;
  index?: number;
};

export function V11CopilotHero({
  title = "Sube la proteína del desayuno y baja el volumen de empuje.",
  description = "Llevas tres días con la proteína de la mañana por debajo del umbral, y el pectoral sigue al 71 % de recuperación con el volumen más alto del bloque. Dos ajustes pequeños, no un cambio de plan.",
  time = "07:10",
  proposalHref = "/asistente",
  whyHref = "/evidencia",
  index = 0,
}: Props) {
  const gradient = useId();
  return (
    <V11Card index={index} className="day-reading">
      <div className="flex items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2.5 text-[13px]">
          <BrandLogo variant="mark" height={22} />
          Copilot ha leído tu día
        </div>
        <V11Chip>{time}</V11Chip>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {/*
        Los botones bajan a 40px del parrafo, no a los 18px de la fuente.

        Es una desviacion deliberada, no un arreglo de fidelidad: medido, con
        el margen original quedaban 20px arriba y 135px de aire por debajo
        antes de que empiece la onda: apretados contra el texto y flotando
        alto.

        Se paso primero a 40px (reparto casi igual) y el usuario los pidio un
        poco mas abajo, asi que van a 56px: 56 arriba y 35 de aire libre antes
        de la onda. No mas: por debajo de ~30px la fila empieza a pisar la
        curva y deja de leerse como un bloque aparte.
      */}
      <div className="mt-14 flex flex-wrap gap-2.5">
        <Link
          href={proposalHref}
          data-glow
          className="v11-button v11-button-primary"
        >
          Ver la propuesta
        </Link>
        <Link href={whyHref} data-glow className="v11-button">
          ¿Por qué?
        </Link>
      </div>
      <svg
        className="day-reading-wave"
        viewBox="0 0 640 76"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradient}>
            <stop stopColor="var(--chart-1)" stopOpacity=".2" />
            <stop offset=".45" stopColor="var(--chart-1)" />
            <stop offset="1" stopColor="var(--pc-chart-to)" />
          </linearGradient>
        </defs>
        <path
          d="M0 60 C70 62 82 38 140 40 S220 4 300 32 S380 58 430 28 S530 34 590 32 S624 26 640 30"
          stroke={`url(#${gradient})`}
          strokeWidth="1.7"
        />
        <circle cx="500" cy="17" r="3.5" fill="var(--pc-chart-to)" />
      </svg>
    </V11Card>
  );
}
