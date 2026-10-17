import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import "@/features/nutrition/components/nutrition-workspace.css";
import "@/features/foods/components/food-library.css";
import { NutritionNav } from "@/features/nutrition/components/nutrition-nav";
import { BrandLogo } from "@/components/shared/brand-logo";
import { FoodFormDialog } from "@/features/foods/components/food-form-dialog";
import { ExternalFoodSearch } from "@/features/foods/components/external-food-search";
import { FoodLibraryGrid } from "@/features/foods/components/food-library-grid";
import { LibrarySearch } from "@/features/foods/components/library-search";
import { FOOD_GROUP_ICONS } from "@/features/foods/lib/group-icons";
import {
  getFoodsLibraryPage,
  LIBRARY_PAGE_SIZE,
} from "@/features/foods/queries";
import {
  dietlyFoodCards,
  externalFoodCards,
  localFoodCard,
  mergeLibraryCards,
} from "@/features/foods/library-queries";
import {
  FOOD_GROUPS,
  FOOD_VIEWS,
  type FoodGroup,
  type FoodView,
} from "@/features/foods/schemas";
import { getSourceAgreements } from "@/features/foods/source-queries";
import { getDietPlanForDate } from "@/features/nutrition/queries";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import { messages } from "@/i18n/es-419";

const t = messages.foods;
export const metadata: Metadata = { title: "Biblioteca de alimentos" };
function href(params: {
  q?: string;
  grupo?: string;
  vista?: string;
  origen?: string;
  pagina?: string;
}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value) search.set(key, value);
  return `/nutricion/alimentos${search.size ? `?${search}` : ""}`;
}
export default async function FoodsLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    grupo?: string;
    vista?: string;
    origen?: string;
    pagina?: string;
  }>;
}) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) || undefined;
  const group = FOOD_GROUPS.includes(params.grupo as FoodGroup)
    ? (params.grupo as FoodGroup)
    : undefined;
  const view = FOOD_VIEWS.includes(params.vista as FoodView)
    ? (params.vista as FoodView)
    : "todos";
  const page = Math.max(1, Number(params.pagina) || 1);
  const { data: profile } = await db
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const date = todayInTimezone(profile?.timezone ?? "America/Costa_Rica");
  /*
    Una sola biblioteca: lo local y lo de los proveedores se piden a la vez y
    se funden en una lista. Antes vivían en tres bloques distintos —tu
    biblioteca, «descubrir con Dietly» y un desplegable con las demás
    fuentes—, así que para encontrar un alimento había que saber de antemano
    en cuál de los tres buscar.

    Lo externo sólo se consulta con una búsqueda escrita: sin texto no hay
    nada que preguntarle a un proveedor, y gastaría cuota para nada.
  */
  const buscando = Boolean(query && query.length >= 2);
  /* Las fuentes externas sólo se piden en la primera página: son resultados de
     una búsqueda, no un catálogo que se pueda paginar junto al local. */
  const primeraPagina = page === 1;
  /* `origen=dietly` pide su catálogo sin escribir nada. El parámetro ya estaba
     declarado pero no hacía nada: lo que traía a Dietly era el descubrimiento
     por defecto, el mismo que colaba 48 fichas de relleno en la primera página
     —rompían la cuenta de 48 por página y empujaban la biblioteca propia hacia
     abajo—. Dándole el significado que su nombre promete, el acceso explícito
     sigue existiendo y la lista deja de llenarse sola. */
  const pedirDietly =
    primeraPagina &&
    view === "todos" &&
    (buscando || params.origen === "dietly");
  const [{ foods, total }, diet, discovery, external] = await Promise.all([
    getFoodsLibraryPage(user.id, { query, group, view, page }),
    getDietPlanForDate(user.id, date),
    pedirDietly ? dietlyFoodCards(query, group) : Promise.resolve(null),
    primeraPagina && buscando && view === "todos"
      ? externalFoodCards(query!)
      : Promise.resolve([]),
  ]);
  /* El cotejo se pide sólo para los 48 de la página: es lo que permite decir
     «corroborado por USDA» sin que haya que abrir nada, y cuesta una consulta
     sobre una lista ya acotada. */
  const acuerdos = await getSourceAgreements(foods.map((f) => f.id));
  const cards = mergeLibraryCards(
    foods.map((food) => localFoodCard(food, acuerdos.get(food.id))),
    [discovery?.status === "ok" ? discovery.foods : [], external],
  );
  const deProveedores = cards.length - foods.length;
  const paginas = Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));
  return (
    <div className="food-library">
      <header className="library-header">
        <div className="library-brand">
          <BrandLogo variant="mark" height={38} />
          <div>
            <h1>Biblioteca de alimentos</h1>
            <p>Descubre lo que aporta cada alimento y hazlo parte de tu día.</p>
          </div>
        </div>
        <FoodFormDialog trigger="expand" />
      </header>
      <div className="nutrition-workspace">
        <NutritionNav active="library" date={date} />
      </div>
      <section aria-labelledby="library-categories-title">
        <div className="library-section-heading">
          <h2 id="library-categories-title">Explora por categoría</h2>
          <span>Encuentra lo que necesitas</span>
        </div>
        <nav
          className="library-categories"
          aria-label="Categorías de alimentos"
        >
          <Link
            href={href({ q: query, vista: view })}
            aria-current={!group ? "true" : undefined}
          >
            <LayoutGrid size={28} />
            <span>Todos</span>
          </Link>
          {FOOD_GROUPS.map((category) => {
            const Icon = FOOD_GROUP_ICONS[category];
            return (
              <Link
                key={category}
                href={href({
                  q: query,
                  grupo: category,
                  vista: view,
                })}
                aria-current={group === category ? "true" : undefined}
                data-category={category}
              >
                <Icon size={28} strokeWidth={1.5} />
                <span>{t.groups[category]}</span>
              </Link>
            );
          })}
        </nav>
      </section>
      {/* Mismas pestañas que la navegacion de Nutricion (capsulas, la activa
          en naranja tenue), para que las dos filas se lean como del mismo
          sistema. */}
      <div className="nutrition-workspace library-views-tabs">
        <div className="nutrition-navigation">
          <nav
            className="nutrition-workspace-tabs"
            aria-label="Colecciones de alimentos"
          >
            {FOOD_VIEWS.map((candidate) => (
              <Link
                key={candidate}
                aria-current={view === candidate ? "page" : undefined}
                href={href({ q: query, grupo: group, vista: candidate })}
              >
                {candidate === "todos" ? "Mi biblioteca" : t.views[candidate]}
              </Link>
            ))}
          </nav>
        </div>
        {/* El buscador, a la derecha de las colecciones: busca dentro de
            la que este elegida. */}
        <div className="library-search-slot">
          <LibrarySearch defaultValue={query} view={view} group={group} />
        </div>
      </div>
      <section aria-labelledby="library-saved-title">
        <div className="library-section-heading">
          <div>
            <h2 id="library-saved-title">
              {query
                ? `Resultados para «${query}»`
                : view === "todos"
                  ? "Tu biblioteca de alimentos"
                  : t.views[view]}
            </h2>
            <p>
              Calorías y macronutrientes por 100 g, o por 100 ml en bebidas.
            </p>
          </div>
          {/* Se dice cuántos vienen de fuera, pero no se separan: la lista es
              una y la fuente va en cada ficha. */}
          {/* El total del catálogo, no el de la página: decir «48 alimentos»
              cuando hay 28.140 es afirmar algo falso. */}
          <span>
            {new Intl.NumberFormat("es-CR").format(total)}{" "}
            {total === 1 ? "alimento" : "alimentos"}
            {deProveedores > 0 ? ` · ${deProveedores} de otras fuentes` : ""}
            {paginas > 1 ? ` · página ${page} de ${paginas}` : ""}
          </span>
        </div>
        {cards.length ? (
          <FoodLibraryGrid foods={cards} diet={diet} date={date} />
        ) : (
          <div className="v11-card library-empty">
            <h3>
              {query
                ? `Sin resultados para «${query}»`
                : "Tu próxima elección puede empezar aquí"}
            </h3>
            <p>
              {query
                ? "Buscamos en tu biblioteca y en USDA, Open Food Facts y Dietly. Prueba con un nombre más general, o créalo con los datos de su etiqueta."
                : "Escribe para buscar en tu biblioteca y en las fuentes externas, o crea un alimento con los datos de su etiqueta."}
            </p>
            <div>
              <FoodFormDialog />
              {(query || group || view !== "todos") && (
                <Link href="/nutricion/alimentos">Quitar filtros</Link>
              )}
            </div>
          </div>
        )}
        {paginas > 1 && (
          <nav className="library-pages" aria-label="Páginas de la biblioteca">
            {page > 1 ? (
              <Link
                href={href({
                  q: query,
                  grupo: group,
                  vista: view,
                  pagina: String(page - 1),
                })}
                rel="prev"
                data-glow=""
              >
                ← Anteriores
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            <span>
              {page} de {new Intl.NumberFormat("es-CR").format(paginas)}
            </span>
            {page < paginas ? (
              <Link
                href={href({
                  q: query,
                  grupo: group,
                  vista: view,
                  pagina: String(page + 1),
                })}
                rel="next"
                data-glow=""
              >
                Siguientes →
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        )}
        {/* Atribución exigida por la ODbL de Open Food Facts: visible en la
            pantalla donde se usan los datos, con enlace a la licencia. */}
        <p className="library-attribution">
          Tu biblioteca más{" "}
          <a href="https://fdc.nal.usda.gov" target="_blank" rel="noreferrer">
            USDA FoodData Central
          </a>
          ,{" "}
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noreferrer"
          >
            Open Food Facts
          </a>{" "}
          (
          <a
            href="https://opendatacommons.org/licenses/odbl/"
            target="_blank"
            rel="noreferrer"
          >
            ODbL
          </a>
          ) y{" "}
          <a
            href="https://www.getdietly.com/api"
            target="_blank"
            rel="noreferrer"
          >
            Dietly
          </a>
          . La fuente aparece en cada ficha. Los datos ausentes se muestran con
          —.
        </p>
      </section>
      <details className="library-other-sources">
        <summary>Buscar en otras fuentes o escanear un código</summary>
        <ExternalFoodSearch initialQuery={query} />
      </details>
    </div>
  );
}
