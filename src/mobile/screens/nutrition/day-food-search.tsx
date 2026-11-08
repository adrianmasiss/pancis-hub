"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, Globe, Plus, Search, X } from "lucide-react";
import {
  recentDayFoods,
  searchDayFoods,
  searchDayFoodOnWeb,
} from "@/features/foods/day-search-actions";
import type { LibraryFood } from "@/features/foods/queries";
import { WebFoodSources } from "@/features/foods/components/web-food-sources";
import { FoodThumb } from "@/mobile/ui/food-thumb";
import { VerifiedBadge } from "@/mobile/ui/verified-badge";
import type { PickedFood } from "./extra-sheet";
import { gramos, kcal } from "./format";

type WebResult = Awaited<ReturnType<typeof searchDayFoodOnWeb>>;

const WEB_STATUS: Record<
  WebResult["result"]["status"],
  { label: string; tone: "good" | "warn" }
> = {
  saved: { label: "Agregado a tu biblioteca", tone: "good" },
  existing: { label: "Ya estaba en tu biblioteca", tone: "good" },
  incomplete: { label: "Datos incompletos", tone: "warn" },
  unavailable: { label: "No disponible ahora", tone: "warn" },
};

/** Distingue «Arroz blanco» crudo (365 kcal) del cocido (130 kcal). */
const COOKED = { crudo: "Crudo", cocido: "Cocido" } as const;

/**
 * Una fila de alimento: nombre en hasta dos líneas (antes se cortaba en una y
 * «Ala de pollo, a la plancha con sa…» no decía cuál era), kcal y macros con
 * los colores de la app, y el «+» en el acento.
 */
function FoodRow({
  food,
  onSelect,
}: {
  food: LibraryFood;
  onSelect: (food: LibraryFood) => void;
}) {
  const unit = food.nutritionBasis === "100ml" ? "ml" : "g";
  return (
    <li>
      <button
        type="button"
        className="m-dsearch-row m-press"
        onClick={() => onSelect(food)}
      >
        <FoodThumb imageUrl={food.imageUrl} foodGroup={food.foodGroup} />
        <span className="m-dsearch-main">
          <span className="m-dsearch-name">
            {food.name}
            {food.confirmed && <VerifiedBadge size={14} />}
          </span>
          {(food.brand || food.cookedState) && (
            <span className="m-dsearch-brand">
              {[food.brand, food.cookedState && COOKED[food.cookedState]]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
          <span className="m-dsearch-macros m-num">
            <strong>{kcal(food.calories)} kcal</strong>
            <span data-macro="p">P {gramos(food.proteinG)}</span>
            <span data-macro="c">C {gramos(food.carbohydrateG)}</span>
            <span data-macro="g">G {gramos(food.fatG)}</span>
            <span className="m-dsearch-basis">/100 {unit}</span>
          </span>
        </span>
        <span className="m-dsearch-add" aria-hidden="true">
          <Plus size={18} strokeWidth={2.5} />
        </span>
      </button>
    </li>
  );
}

function SkeletonRows() {
  return (
    <ul className="m-dsearch-list" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="m-dsearch-skel">
          <span />
          <span />
        </li>
      ))}
    </ul>
  );
}

export function DayFoodSearch({
  onSelect,
}: {
  onSelect: (food: PickedFood) => void;
}) {
  const [term, setTerm] = useState("");
  const query = term.trim();
  const [recent, setRecent] = useState<LibraryFood[] | null>(null);
  const [local, setLocal] = useState<{
    query: string;
    foods: LibraryFood[];
    error?: string;
  } | null>(null);
  const [web, setWeb] = useState<WebResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);

  useEffect(() => {
    let active = true;
    recentDayFoods()
      .then((foods) => active && setRecent(foods))
      .catch(() => active && setRecent([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (query.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const foods = await searchDayFoods(query);
        if (active) setLocal({ query, foods });
      } catch {
        if (active)
          setLocal({
            query,
            foods: [],
            error: "No pudimos consultar tu biblioteca. Prueba de nuevo.",
          });
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  const reset = (value: string) => {
    request.current += 1;
    setTerm(value);
    setWeb(null);
    setBusy(false);
    setError("");
  };

  const searchWeb = async () => {
    const id = ++request.current;
    setBusy(true);
    setError("");
    setWeb(null);
    try {
      const result = await searchDayFoodOnWeb(query);
      if (request.current === id) setWeb(result);
    } catch {
      if (request.current === id)
        setError("No pudimos completar la búsqueda. Vuelve a intentarlo.");
    } finally {
      if (request.current === id) setBusy(false);
    }
  };

  const searching = query.length >= 2;
  const ready = searching && local?.query === query;
  const foods = ready ? local.foods : [];
  const status = !searching
    ? "Escribe al menos 2 letras para buscar en tu biblioteca."
    : !ready
      ? "Buscando en tu biblioteca…"
      : (local.error ??
        (foods.length
          ? `${foods.length} en tu biblioteca. Elige uno y ajusta la cantidad.`
          : `No encontramos «${query}» en tu biblioteca.`));

  const outside = (
    <section
      className="m-dsearch-outside"
      data-prominent={ready && !foods.length ? "" : undefined}
      aria-label="Buscar un alimento nuevo"
    >
      <div>
        <h3 className="m-dsearch-outside-title">
          {ready && !foods.length
            ? `Busquemos «${query}» afuera`
            : "¿No está el que buscas?"}
        </h3>
        <p className="m-sub">
          Primero en Open Food Facts, con etiquetas reales; si no está, en la
          web. Solo se guarda si los datos están completos.
        </p>
      </div>
      <button
        type="button"
        className="m-btn m-press"
        data-variant={ready && !foods.length ? "primary" : undefined}
        disabled={busy}
        aria-busy={busy}
        onClick={() => void searchWeb()}
      >
        <Globe
          size={18}
          aria-hidden="true"
          className={busy ? "m-dsearch-spin" : undefined}
        />
        {busy ? "Consultando fuentes…" : "Buscar fuera de tu biblioteca"}
      </button>
      {busy && (
        <p role="status" className="m-sub">
          Open Food Facts responde en un segundo; la web puede tardar hasta un
          minuto.
        </p>
      )}
      {error && (
        <p role="alert" className="m-field-error">
          {error}
        </p>
      )}
      {web && (
        <div className="m-dsearch-web">
          <p
            className="m-dsearch-pill"
            data-tone={WEB_STATUS[web.result.status].tone}
          >
            {WEB_STATUS[web.result.status].tone === "good" ? (
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            ) : (
              <CircleAlert size={14} aria-hidden="true" />
            )}
            {WEB_STATUS[web.result.status].label}
          </p>
          <p role="status" className="m-sub">
            {web.result.message}
          </p>
          {web.food && (
            <ul className="m-dsearch-list">
              <FoodRow food={web.food} onSelect={onSelect} />
            </ul>
          )}
          <WebFoodSources sources={web.result.sources} />
          {web.result.searchSuggestions && (
            <iframe
              title="Sugerencias de búsqueda de Google"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              srcDoc={web.result.searchSuggestions}
              className="h-24 w-full border-0"
            />
          )}
        </div>
      )}
    </section>
  );

  return (
    <div className="m-dsearch">
      <label className="m-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar alimento</span>
        <input
          type="search"
          placeholder="Alimento, producto o marca"
          maxLength={120}
          enterKeyHint="search"
          value={term}
          onChange={(event) => reset(event.target.value)}
        />
        {term && (
          <button
            type="button"
            className="m-dsearch-clear m-press"
            aria-label="Borrar búsqueda"
            onClick={() => reset("")}
          >
            <X size={14} strokeWidth={3} aria-hidden="true" />
          </button>
        )}
      </label>
      <p role="status" className="sr-only">
        {status}
      </p>

      {!searching &&
        (recent === null ? (
          <SkeletonRows />
        ) : recent.length ? (
          <section className="m-dsearch-group" aria-label="Recientes">
            <h3 className="m-eyebrow">Recientes</h3>
            <ul className="m-dsearch-list m-dsearch-enter">
              {recent.map((food) => (
                <FoodRow key={food.id} food={food} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        ) : (
          <p className="m-sub m-dsearch-hint">
            Escribe un alimento, un producto o una marca. Lo que registres
            aparecerá aquí para la próxima vez.
          </p>
        ))}

      {searching && !ready && <SkeletonRows />}

      {ready && local.error && (
        <p role="alert" className="m-field-error">
          {local.error}
        </p>
      )}

      {ready && !foods.length && !local.error && outside}

      {ready && foods.length > 0 && (
        <section className="m-dsearch-group" aria-label="En tu biblioteca">
          <h3 className="m-eyebrow">
            En tu biblioteca <span className="m-num">· {foods.length}</span>
          </h3>
          <ul className="m-dsearch-list m-dsearch-enter" key={local.query}>
            {foods.map((food) => (
              <FoodRow key={food.id} food={food} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      )}

      {ready && foods.length > 0 && outside}
    </div>
  );
}
