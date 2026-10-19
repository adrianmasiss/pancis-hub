"use client";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Check, Heart, Info } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action";
import type { DietTemplateView } from "@/features/dashboard/queries";
import type { LibraryCardFood } from "../library-types";
import { toggleFavoriteFood } from "../actions";
import { importExternalFood } from "../external-actions";
import { FoodDetailCard } from "./food-detail-card";
import { FoodPhoto } from "./food-photo";
import { SourceSeal } from "./source-seal";
import { LibrarySwapSheet } from "./library-swap-sheet";
import { messages } from "@/i18n/es-419";

const number = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(n);

function FoodCard({
  food,
  onUse,
  onDetail,
}: {
  food: LibraryCardFood;
  onUse: () => void;
  onDetail: () => void;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [favorite, setFavorite] = useOptimistic(
    food.local?.isFavorite ?? false,
  );
  const [pending, startTransition] = useTransition();
  const save = () =>
    startTransition(async () => {
      if (food.local) {
        setFavorite(!favorite);
        const result = await toggleFavoriteFood({ foodId: food.local.id });
        if ("error" in result) toast.error(result.error);
      } else {
        /* El proveedor lo trae la propia tarjeta: escribirlo a mano ataba
           la lista a Dietly y dejaba fuera a USDA y Open Food Facts. */
        if (!food.provider || !food.externalId) return;
        const result = await importExternalFood({
          source: food.provider,
          externalId: food.externalId,
        });
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setSaved(true);
        toast.success("Alimento guardado en tu biblioteca");
      }
      router.refresh();
    });
  const subtitle = [
    food.brand,
    food.cookedState ? `Alimento ${food.cookedState}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="v11-card food-library-card">
      {/* La foto vive en una caja 4:3 que no cambia con lo que lleve dentro.
          La foto del proveedor se ajusta sin recortarse ni estirarse; la
          ilustración es una celda cuadrada del atlas y se dibuja cuadrada,
          centrada. Antes la celda se estiraba al ancho de la caja y el
          aguacate salía aplastado. */}
      <div className="library-food-photo">
        <FoodPhoto food={food} />
        <span className="library-food-category">
          {messages.foods.groups[food.group]}
        </span>
        {food.local ? (
          <button
            type="button"
            className="library-save"
            onClick={save}
            disabled={pending || saved || !food.canUse}
            aria-pressed={food.local ? favorite : saved}
            aria-label={
              food.local
                ? `${favorite ? "Quitar de favoritos" : "Guardar favorito"} — ${food.name}`
                : `Guardar alimento — ${food.name}`
            }
          >
            {saved ? (
              <Check size={18} />
            ) : food.local ? (
              <Heart size={18} fill={favorite ? "currentColor" : "none"} />
            ) : (
              <Bookmark size={18} />
            )}
          </button>
        ) : (
          <span className="absolute top-2 right-2">
            <ActionButton
              family="add"
              compact
              loading={pending}
              onClick={save}
              disabled={pending || saved || !food.canUse}
              aria-label={`Guardar alimento — ${food.name}`}
              aria-pressed={saved}
            />
          </span>
        )}
      </div>
      <div className="library-food-body">
        <h3 title={food.name}>{food.name}</h3>
        {subtitle && <p className="library-food-brand">{subtitle}</p>}
        {/* «/100 g» junto a la cifra: la ficha se lee sola aunque el
            encabezado de la sección quede fuera de la pantalla. */}
        <p className="library-food-energy">
          <strong>{number(food.macros.calories)}</strong>
          <span>kcal / 100 {food.basis === "100ml" ? "ml" : "g"}</span>
        </p>
        <dl className="library-food-macros">
          {[
            ["Proteína", food.macros.proteinG],
            ["Carbos", food.macros.carbohydrateG],
            ["Grasas", food.macros.fatG],
          ].map(([label, value]) => (
            <div key={String(label)}>
              {/* En movil la tarjeta es estrecha: se ve la letra y el nombre
                  completo queda para el lector de pantalla. */}
              <dt>
                <span className="library-macro-full">{label}</span>
                <span className="library-macro-short" aria-hidden="true">
                  {String(label).charAt(0)}
                </span>
              </dt>
              <dd>
                {number(value as number | null)} <small>g</small>
              </dd>
            </div>
          ))}
        </dl>
        <p className="library-food-source" title={food.source}>
          {food.source}
          {food.local?.isCorrected ? " · Corregido por ti" : ""}
        </p>
        <SourceSeal agreement={food.agreement} />
        {!food.canUse && (
          <p className="library-food-incomplete">
            {food.source.includes("IA")
              ? "Estimación IA: solo para consulta."
              : "Faltan datos para calcular una sustitución."}
          </p>
        )}
        {/* Dos acciones y ninguna más: usarlo, o ver la ficha completa (fibra,
            fuentes, ajustes). La fibra salió de la tarjeta: es dato de
            consulta, no de decisión, y la ficha ya la tiene. */}
        <div className="library-food-actions">
          <ActionButton
            family="edit"
            icon="swap"
            disabled={!food.canUse}
            onClick={onUse}
          >
            Usar en mi dieta
          </ActionButton>
          <button
            type="button"
            className="library-detail-button"
            onClick={onDetail}
            aria-label={`Ver información — ${food.name}`}
            title="Ver ficha"
          >
            <Info size={17} />
          </button>
        </div>
      </div>
    </li>
  );
}

export function FoodLibraryGrid({
  foods,
  diet,
  date,
}: {
  foods: LibraryCardFood[];
  diet: DietTemplateView | null;
  date: string;
}) {
  const [selected, setSelected] = useState<LibraryCardFood | null>(null);
  const [detail, setDetail] = useState<LibraryCardFood | null>(null);
  return (
    <>
      <ul className="food-library-grid">
        {foods.map((food) => (
          <FoodCard
            key={food.key}
            food={food}
            onUse={() => setSelected(food)}
            onDetail={() => setDetail(food)}
          />
        ))}
      </ul>
      {selected && (
        <LibrarySwapSheet
          key={selected.key}
          food={selected}
          diet={diet}
          date={date}
          onClose={() => setSelected(null)}
        />
      )}
      <FoodDetailCard
        food={detail}
        diet={diet}
        onClose={() => setDetail(null)}
        onUse={(food) => {
          setSelected(food);
          setDetail(null);
        }}
      />
    </>
  );
}
