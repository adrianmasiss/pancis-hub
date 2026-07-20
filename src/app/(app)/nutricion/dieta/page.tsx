import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDietForm } from "@/features/nutrition/components/upload-diet-form";

export const metadata: Metadata = {
  title: "Importar Dieta",
};

export default function UploadDietPage() {
  return (
    <>
      <PageHeader
        title="Importar Dieta con IA"
        description="Sube una foto o PDF de tu plan de alimentación. La Inteligencia Artificial lo leerá y adaptará tus macros y comidas diarias."
      />
      <div className="max-w-2xl py-6">
        <UploadDietForm />
      </div>
    </>
  );
}
