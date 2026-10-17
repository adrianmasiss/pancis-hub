import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import "@/features/nutrition/components/nutrition-workspace.css";
import "@/features/foods/components/food-library.css";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ReviewQueue } from "@/features/foods/components/review-queue";
import { getFoodsToReview } from "@/features/foods/source-queries";
import { DIVERGENCE_THRESHOLD } from "@/features/foods/lib/source-agreement";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fuentes que no coinciden" };

export default async function ReviewPage() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const items = await getFoodsToReview();

  return (
    <div className="food-library">
      <header className="library-header">
        <div className="library-brand">
          <BrandLogo variant="mark" height={38} />
          <div>
            <h1>Fuentes que no coinciden</h1>
            <p>
              Alimentos que dos proveedores describen de forma distinta. Elige
              cuál vale para tu biblioteca.
            </p>
          </div>
        </div>
        <Link href="/nutricion/alimentos" className="review-back">
          <ArrowLeft size={16} aria-hidden="true" /> Volver a la biblioteca
        </Link>
      </header>

      {/* El porqué va arriba y no en una ayuda escondida: sin esto la pantalla
          parece una lista de errores de la aplicación, y no lo es. */}
      <section className="v11-card review-intro">
        <h2>Por qué aparecen aquí</h2>
        <p>
          Cuando dos fuentes describen el mismo alimento, tu biblioteca guarda
          el valor de la más fiable y apunta lo que dijo cada una.{" "}
          <strong>Nunca se promedian:</strong> una media entre un laboratorio y
          algo que alguien tecleó en el móvil es un número que no aparece en
          ningún informe.
        </p>
        <p>
          Estos difieren más de un {DIVERGENCE_THRESHOLD} %. Casi nunca es que
          la comida sea rara — lo habitual es que alguien escribiera el valor
          por porción en la casilla de por 100 g.
        </p>
        <p className="review-intro-note">
          Lo que elijas vale solo para ti. El catálogo es compartido y no se
          toca, así que si el proveedor arregla su dato, los demás se
          benefician sin que nadie tenga que deshacer nada.
        </p>
      </section>

      {items.length ? (
        <ReviewQueue items={items} />
      ) : (
        <section className="v11-card review-empty">
          <ShieldCheck size={32} strokeWidth={1.4} aria-hidden="true" />
          <h2>Ninguna fuente se contradice</h2>
          <p>
            Todo lo que tiene más de una medición concuerda dentro del{" "}
            {DIVERGENCE_THRESHOLD} %. Si al sembrar el catálogo aparece un
            desacuerdo nuevo, lo verás aquí.
          </p>
          <Link href="/nutricion/alimentos">Ir a la biblioteca</Link>
        </section>
      )}
    </div>
  );
}
