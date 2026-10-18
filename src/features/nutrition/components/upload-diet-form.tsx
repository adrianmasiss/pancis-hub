"use client";

import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { useState } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { DropZone } from "@/components/shared/form-kit";
import "./upload-diet-form.css";
import { DietReviewEditor } from "@/features/nutrition/components/diet-review-editor";
import {
  parseDietPlanImage,
  suggestCatalogMatches,
  type CatalogFoodMatch,
  type DietPlanResponse,
} from "@/features/nutrition/ai-actions";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.aiDiet;

const SUPPORTED_DIET_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_DIET_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) reject(new Error(t.errors.readFailed));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error(t.errors.readFailed));
    reader.readAsDataURL(file);
  });
}

export function UploadDietForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<DietPlanResponse | null>(null);
  const [suggestions, setSuggestions] = useState<
    Record<string, CatalogFoodMatch | null>
  >({});
  // Cambia en cada analisis exitoso para remontar el editor con datos
  // limpios (evita reusar el estado editado de un archivo anterior).
  const [reviewKey, setReviewKey] = useState(0);
  const [error, setError] = useState("");

  const handleFileChange = (
    selectedFile: File | null,
    input: HTMLInputElement | null,
  ) => {
    setParsedData(null);
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!SUPPORTED_DIET_FILE_TYPES.has(selectedFile.type)) {
      setFile(null);
      if (input) input.value = "";
      setError(t.errors.unsupportedFormat);
      return;
    }
    if (selectedFile.size > MAX_DIET_FILE_SIZE_BYTES) {
      setFile(null);
      if (input) input.value = "";
      setError(t.errors.fileTooLarge);
      return;
    }
    setFile(selectedFile);
  };

  const handleParse = async () => {
    if (!file) return;
    setIsLoading(true);
    setError("");
    try {
      const base64 = await readFileAsBase64(file);
      const result = await parseDietPlanImage(base64, file.type);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Se resuelven las sugerencias de catalogo ANTES de montar el
        // editor, para que el prellenado este listo desde el primer
        // render (evita una carrera entre el mount y una respuesta
        // async tardia).
        const itemNames = result.data.meals.flatMap((meal) =>
          meal.items.map((item) => item.name),
        );
        const matches = await suggestCatalogMatches(itemNames);
        setSuggestions(matches);
        setParsedData(result.data);
        setReviewKey((previous) => previous + 1);
      }
    } catch {
      setError(t.errors.readFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Section title={t.uploadTitle}>
        <DropZone
          accept="image/jpeg,image/png,image/webp,application/pdf"
          title={t.dropTitle}
          hint={t.dropHint}
          file={file}
          busy={isLoading}
          busyLabel={t.analyzing}
          onFile={handleFileChange}
          onClear={() => handleFileChange(null, null)}
        />
        {error ? (
          <p className="diet-upload-error" role="alert">
            {error}
          </p>
        ) : null}
        {/* La accion prominente de esta pantalla: subir la dieta es a lo
            unico que se entra aqui. */}
        <div className="diet-upload-actions">
          <p>{t.analyzeHint}</p>
          <Button
            variant="brand"
            size="lg"
            onClick={handleParse}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <NewtonsCradle size={24} />
            ) : (
              <Brain className="size-4" />
            )}
            {isLoading ? t.analyzing : t.analyze}
          </Button>
        </div>
      </Section>

      {parsedData ? (
        <DietReviewEditor
          key={reviewKey}
          parsed={parsedData}
          suggestions={suggestions}
        />
      ) : null}
    </div>
  );
}
