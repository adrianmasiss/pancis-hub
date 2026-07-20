"use client";

import { useState } from "react";
import { Brain, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setParsedData(null);
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!SUPPORTED_DIET_FILE_TYPES.has(selectedFile.type)) {
      setFile(null);
      event.target.value = "";
      setError(t.errors.unsupportedFormat);
      return;
    }
    if (selectedFile.size > MAX_DIET_FILE_SIZE_BYTES) {
      setFile(null);
      event.target.value = "";
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="text-primary size-5" />
            {t.uploadTitle}
          </CardTitle>
          <CardDescription>{t.uploadDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="diet-file">{t.fileLabel}</Label>
            <Input
              id="diet-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
            />
          </div>
          {error ? (
            <p className="text-destructive mt-4 text-sm">{error}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={handleParse} disabled={!file || isLoading}>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Brain className="size-4" />
            )}
            {isLoading ? t.analyzing : t.analyze}
          </Button>
        </CardFooter>
      </Card>

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
