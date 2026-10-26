"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useNow, mmss } from "@/features/training/components/live-session";
import { markNav } from "@/mobile/nav-direction";
import {
  liveKeys,
  useStored,
  type LivePause,
} from "@/mobile/screens/training/live-store";

export type LiveSession = {
  id: string;
  startedAt: string;
  pausedSeconds: number;
  /** El dia del plan; null en una sesion libre. */
  dayName: string | null;
};

/**
 * Mini barra «Entrenando · Press banca · 32:14» sobre la barra inferior,
 * en toda la app mientras haya una sesion abierta. Tocarla vuelve a la
 * sesion. La propia pantalla de la sesion la oculta (`data-m-fullscreen`).
 */
export function LiveSessionBar({ live }: { live: LiveSession }) {
  const now = useNow();
  const keys = liveKeys(live.id);
  const [pause] = useStored<LivePause>(keys.pause, { since: null, ms: 0 });
  const [progress] = useStored<{ name?: string } | null>(keys.progress, null);
  const paused = pause.since !== null;
  const elapsed = now
    ? now -
      Date.parse(live.startedAt) -
      live.pausedSeconds * 1000 -
      (paused ? now - pause.since! : 0)
    : 0;
  const what = progress?.name ?? live.dayName ?? "Sesión libre";

  return (
    <Link
      href="/entrenamiento?vista=sesion"
      className="m-live-bar m-press"
      onClick={() => markNav("forward")}
      aria-label={`${paused ? "Entrenamiento en pausa" : "Entrenando"}: ${what}. Volver a la sesión`}
    >
      <span
        className={paused ? "m-live-dot" : "m-live-dot m-pulse"}
        aria-hidden="true"
      />
      <span className="m-live-bar-text">
        <strong>{paused ? "En pausa" : "Entrenando"}</strong>
        <span aria-hidden="true"> · </span>
        <span className="m-live-bar-what">{what}</span>
      </span>
      <span className="m-num m-live-bar-time" role="timer">
        {now ? mmss(elapsed) : ""}
      </span>
      <ChevronRight size={16} className="m-chevron" aria-hidden="true" />
    </Link>
  );
}
