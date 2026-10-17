"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mic, Search } from "lucide-react";
import {
  suggestFoods,
  type FoodSuggestion,
} from "@/features/foods/suggest-actions";

type Suggestion = FoodSuggestion;

/* Web Speech API: no esta en los tipos del DOM de TypeScript. Lo minimo. */
type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

/**
 * La busqueda devuelve por orden alfabetico, y con «arr» lo primero era un
 * plato congelado de 150 caracteres que empezaba con comillas. Para sugerir
 * manda la relevancia: empieza con lo escrito, luego alguna palabra que
 * empieza asi, luego el resto; a igualdad, el nombre mas corto. Sin nombres
 * repetidos.
 */
export function rankSuggestions<T extends { name: string }>(
  items: T[],
  term: string,
): T[] {
  const needle = fold(term.trim());
  const score = (name: string) => {
    const hay = fold(name);
    if (hay.startsWith(needle)) return 0;
    const words = hay.split(/[^a-z0-9ñ]+/);
    // «pollo» como palabra entera pesa mas que «pollo» dentro de «pollock».
    if (words.includes(needle)) return 1;
    if (words.some((word) => word.startsWith(needle))) return 2;
    return 3;
  };
  // Elegir una sugerencia busca ese nombre: dos «Arroz» (crudo y cocido, o
  // dos fuentes) llevan a la misma busqueda, asi que se muestra uno.
  const seen = new Set<string>();
  return [...items]
    .sort(
      (a, b) => score(a.name) - score(b.name) || a.name.length - b.name.length,
    )
    .filter((item) => {
      const key = fold(item.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Buscador de la Biblioteca: capsula con lupa, sugerencias mientras se
 * escribe y dictado por voz cuando el navegador lo permite.
 *
 * Sigue siendo un `<form method="get">`: sin JavaScript busca igual, y la
 * busqueda vive en la URL. Las sugerencias son atajos sobre la misma busqueda
 * (elegir una es buscar ese nombre), con el patron de combobox: flechas para
 * moverse, Enter para elegir, Escape para cerrar.
 */
export function LibrarySearch({
  defaultValue,
  view,
  group,
}: {
  defaultValue?: string;
  view?: string;
  group?: string;
}) {
  /* Colapsado es un circulo con la lupa, junto a «Crear alimento». Se abre
     al tocarlo y vuelve a circulo al salir si no se escribio nada. Con una
     busqueda en la URL arranca abierto: se ve que hay un filtro puesto. */
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [listening, setListening] = useState(false);
  const [canDictate, setCanDictate] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const listId = useId();

  // El microfono solo aparece si el navegador sabe dictar: un boton que no
  // hace nada es peor que no tenerlo. Se decide tras montar (SSR no lo sabe).
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setCanDictate(Boolean(recognitionCtor())),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) return;
    let alive = true;
    const timer = setTimeout(() => {
      suggestFoods({ term })
        .then((results) => {
          if (!alive) return;
          setSuggestions(rankSuggestions(results, term).slice(0, 6));
          setActive(-1);
        })
        .catch(() => undefined);
    }, 180);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [value]);

  const shown = value.trim().length >= 2 ? suggestions : [];
  const expandedField = focused || value.length > 0;
  const expanded = open && shown.length > 0;

  const choose = (name: string) => {
    setValue(name);
    setOpen(false);
    if (inputRef.current) inputRef.current.value = name;
    formRef.current?.requestSubmit();
  };

  const dictate = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "es-MX";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) {
        setValue(text);
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  /* Lo escrito se ve suave y lo que la sugerencia anade, fuerte: se lee de
     un vistazo que completa cada una. */
  const highlight = (name: string) => {
    const term = value.trim();
    const at = name
      .toLocaleLowerCase("es")
      .indexOf(term.toLocaleLowerCase("es"));
    if (at < 0 || !term) return <strong>{name}</strong>;
    return (
      <>
        {at > 0 ? <strong>{name.slice(0, at)}</strong> : null}
        <span>{name.slice(at, at + term.length)}</span>
        <strong>{name.slice(at + term.length)}</strong>
      </>
    );
  };

  return (
    <form
      ref={formRef}
      action="/nutricion/alimentos"
      method="get"
      role="search"
      className="library-search-pill"
      data-open={expanded || undefined}
      data-expanded={expandedField || undefined}
      onSubmit={() => setOpen(false)}
    >
      {view && view !== "todos" ? (
        <input type="hidden" name="vista" value={view} />
      ) : null}
      {group ? <input type="hidden" name="grupo" value={group} /> : null}
      <div className="library-search-field">
        {/* Cerrado, la lupa abre el campo; abierto, busca. Siempre
            type="button": si cambiara a "submit" al abrirse, el mismo clic
            que lo abre enviaria el formulario. */}
        <button
          type="button"
          className="library-search-toggle"
          aria-label={expandedField ? "Buscar" : "Abrir el buscador"}
          onClick={() => {
            if (expandedField) {
              formRef.current?.requestSubmit();
              return;
            }
            setFocused(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
        >
          <Search size={20} strokeWidth={1.9} aria-hidden="true" />
        </button>
        <input
          ref={inputRef}
          name="q"
          type="search"
          value={value}
          maxLength={80}
          placeholder="Busca un alimento o una marca…"
          aria-label="Buscar alimentos"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            expanded && active >= 0 ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          tabIndex={expandedField ? 0 : -1}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() =>
            setTimeout(() => {
              setOpen(false);
              setFocused(false);
            }, 120)
          }
          onKeyDown={(event) => {
            if (!expanded) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => (i + 1) % shown.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
            } else if (event.key === "Enter" && active >= 0) {
              event.preventDefault();
              choose(shown[active]!.name);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {canDictate && expandedField ? (
          <button
            type="button"
            className="library-search-mic"
            onClick={dictate}
            aria-pressed={listening}
            aria-label={listening ? "Dejar de escuchar" : "Buscar por voz"}
          >
            <Mic size={20} strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label="Sugerencias"
        className="library-search-suggestions"
        hidden={!expanded}
      >
        {shown.map((suggestion, index) => (
          <li
            key={suggestion.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => {
              event.preventDefault();
              choose(suggestion.name);
            }}
            onMouseEnter={() => setActive(index)}
          >
            <Search size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="library-search-name">
              {highlight(suggestion.name)}
            </span>
            {suggestion.brand ? <small>{suggestion.brand}</small> : null}
          </li>
        ))}
      </ul>
    </form>
  );
}
