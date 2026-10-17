import { redirect } from "next/navigation";
import { grupoDelMusculo } from "@/features/training/lib/library-groups";

/* El catálogo pasó a ser la pestaña «Biblioteca» de Entrenamiento. La ruta
   se queda para no romper enlaces guardados: lleva a la pestaña con la misma
   búsqueda, y el músculo exacto se traduce a su grupo. */
export default async function ExerciseCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; musculo?: string; equipo?: string }>;
}) {
  const { q, musculo, equipo } = await searchParams;
  const search = new URLSearchParams({ vista: "biblioteca" });
  if (q) search.set("q", q);
  const grupo = musculo ? grupoDelMusculo(musculo) : undefined;
  if (grupo) search.set("grupo", grupo.id);
  if (equipo) search.set("equipo", equipo);
  redirect(`/entrenamiento?${search}`);
}
