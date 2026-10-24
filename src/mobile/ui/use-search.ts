"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Busqueda con espera: pide `search(q)` 250 ms despues de la ultima tecla y
 * solo muestra resultados del termino vigente (los de uno anterior que
 * lleguen tarde no se cuelan).
 */
export function useSearch<T>(
  term: string,
  search: (q: string) => Promise<T[] | null>,
  min = 2,
): T[] {
  const q = term.trim();
  const ref = useRef(search);
  useEffect(() => {
    ref.current = search;
  });
  const [found, setFound] = useState<{ q: string; items: T[] }>({
    q: "",
    items: [],
  });

  useEffect(() => {
    if (q.length < min) return;
    let alive = true;
    const id = window.setTimeout(() => {
      void ref.current(q).then((items) => {
        if (alive && items) setFound({ q, items });
      });
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [q, min]);

  return q.length >= min && found.q === q ? found.items : [];
}
