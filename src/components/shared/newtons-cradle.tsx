"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Decorative by default: the containing status/button supplies its label. */
export function NewtonsCradle({
  size = 50,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const element = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let visible = true;
    const sync = () =>
      node.toggleAttribute("data-paused", document.hidden || !visible);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <span
      ref={element}
      className={cn("newtons-cradle", className)}
      style={{ "--uib-size": `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="newtons-cradle__dot" />
      <span className="newtons-cradle__dot" />
      <span className="newtons-cradle__dot" />
      <span className="newtons-cradle__dot" />
    </span>
  );
}
