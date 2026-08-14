import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Apple, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ExternalFoodSearch } from "@/features/foods/components/external-food-search";
import { FoodFormDialog } from "@/features/foods/components/food-form-dialog";
import { FoodRow } from "@/features/foods/components/food-row";
import { getFoodsLibrary } from "@/features/foods/queries";
import {
  FOOD_GROUPS,
  FOOD_VIEWS,
  type FoodGroup,
  type FoodView,
} from "@/features/foods/schemas";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { SegmentedNav } from "@/components/ui/segmented-nav";

const t = messages.foods;

export const metadata: Metadata = { title: t.title };

function buildHref(params: {
  q?: string;
  grupo?: string;
  vista?: string;
}): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.grupo) search.set("grupo", params.grupo);
  if (params.vista && params.vista !== "todos")
    search.set("vista", params.vista);
  const qs = search.toString();
  return `/nutricion/alimentos${qs ? `?${qs}` : ""}`;
}

export default async function FoodsLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grupo?: string; vista?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const group = FOOD_GROUPS.includes(params.grupo as FoodGroup)
    ? (params.grupo as FoodGroup)
    : undefined;
  const view: FoodView = FOOD_VIEWS.includes(params.vista as FoodView)
    ? (params.vista as FoodView)
    : "todos";

  const foods = await getFoodsLibrary(user.id, { query, group, view });

  return (
    <>
      {/* Sin icono identitario: la barra superior y el riel ya dicen donde
          estas. La descripcion si se queda, porque explica que hay dentro. */}
      <PageHeader
        title={t.title}
        description={t.subtitle}
        actions={<FoodFormDialog />}
      />

      <form
        action="/nutricion/alimentos"
        method="get"
        className="flex items-center gap-2"
      >
        {view !== "todos" ? (
          <input type="hidden" name="vista" value={view} />
        ) : null}
        {group ? <input type="hidden" name="grupo" value={group} /> : null}
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t.searchPlaceholder}
            className="pl-9"
            aria-label={t.searchPlaceholder}
          />
        </div>
        <Button type="submit" variant="outline">
          {t.searchButton}
        </Button>
      </form>

      <SegmentedNav
        label={t.title}
        items={FOOD_VIEWS.map((candidate) => ({
          href: buildHref({ q: query, grupo: group, vista: candidate }),
          label: t.views[candidate],
          active: view === candidate,
        }))}
      />

      <SegmentedNav
        label={t.groups.all}
        items={[
          {
            href: buildHref({ q: query, vista: view }),
            label: t.groups.all,
            active: !group,
          },
          ...FOOD_GROUPS.map((candidate) => ({
            href: buildHref({ q: query, grupo: candidate, vista: view }),
            label: t.groups[candidate],
            active: group === candidate,
          })),
        ]}
      />

      {foods.length > 0 ? (
        /* Superficie, no caja de filete: en este sistema el bloque se agrupa
           por salto de tono, y un borde de 1px sobre el marino desaparece. */
        <ul className="surface-card divide-rule divide-y px-5">
          {foods.map((food) => (
            <FoodRow key={food.id} food={food} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyDescription}
          icon={Apple}
        />
      )}

      {/*
        Busqueda externa como complemento, nunca como reemplazo: primero se
        ve el catalogo local y solo si no alcanza se consulta a USDA y Open
        Food Facts (docs/02_PRODUCT_REQUIREMENTS.md 7.1).
      */}
      <ExternalFoodSearch initialQuery={query} />
    </>
  );
}
