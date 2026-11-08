import Link from "next/link";
import type { WebFoodResult } from "@/features/foods/lib/web-food";
import { WebFoodSources } from "@/features/foods/components/web-food-sources";

export function FoodResearchResults({
  results,
  mobile = false,
}: {
  results?: WebFoodResult[];
  mobile?: boolean;
}) {
  if (!results?.length) return null;
  return (
    <div
      className="my-4 space-y-4"
      aria-label="Resultado de la búsqueda de alimentos"
    >
      {results.map((result, index) => (
        <section key={index} className="border-border border-y py-4">
          <p className="font-semibold">{result.name ?? result.query}</p>
          <p className="mt-2 text-sm">{result.message}</p>
          {result.foodId && (
            <Link
              className="text-primary mt-3 inline-block text-sm underline underline-offset-4"
              href={
                mobile
                  ? `/nutricion?vista=biblioteca&alimento=${result.foodId}`
                  : `/nutricion/alimentos?q=${encodeURIComponent(result.name ?? result.query)}`
              }
            >
              Ver en mi biblioteca
            </Link>
          )}
          <WebFoodSources sources={result.sources} />
          {result.searchSuggestions && (
            <iframe
              title={`Sugerencias de Google para ${result.query}`}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              srcDoc={result.searchSuggestions}
              className="mt-3 h-24 w-full border-0"
            />
          )}
        </section>
      ))}
    </div>
  );
}
