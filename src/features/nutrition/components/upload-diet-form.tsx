"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseDietPlanImage,
  saveDietTemplate,
  type DietPlanResponse,
} from "../ai-actions";
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
import { Brain, CheckCircle2, Loader2, UploadCloud } from "lucide-react";

const SUPPORTED_DIET_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_DIET_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function UploadDietForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<DietPlanResponse | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setParsedData(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!SUPPORTED_DIET_FILE_TYPES.has(selectedFile.type)) {
      setFile(null);
      e.target.value = "";
      setError("Formato no soportado. Sube una imagen JPG, PNG, WebP o PDF.");
      return;
    }

    if (selectedFile.size > MAX_DIET_FILE_SIZE_BYTES) {
      setFile(null);
      e.target.value = "";
      setError("El archivo es muy grande. Sube un archivo de 5 MB o menos.");
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleParse = async () => {
    if (!file) return;
    setIsLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(",")[1];
        if (!base64String) {
          setError("No se pudo leer el archivo.");
          setIsLoading(false);
          return;
        }

        const res = await parseDietPlanImage(base64String, file.type);
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setParsedData(res.data);
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Error procesando el archivo.");
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;
    setIsLoading(true);
    const { error } = await saveDietTemplate(parsedData);
    if (error) {
      setError(error);
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="text-primary h-5 w-5" />
            Sube tu dieta
          </CardTitle>
          <CardDescription>
            Sube una foto, captura de pantalla o PDF de tu plan alimenticio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Archivo de tu dieta</Label>
            <Input
              id="picture"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
            />
          </div>
          {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleParse} disabled={!file || isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Analizar con IA
          </Button>
        </CardFooter>
      </Card>

      {parsedData && (
        <Card className="border-primary/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="text-primary h-6 w-6" />
              {parsedData.name || "Plan de Alimentación"}
            </CardTitle>
            <CardDescription className="text-sm">
              Dieta analizada por IA — revisa los datos antes de guardarla.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="bg-primary/10 border-primary/20 rounded-xl border p-3 text-center">
                <p className="text-primary text-2xl font-bold">
                  {parsedData.target_calories}
                </p>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Calorías
                </p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {parsedData.target_protein}g
                </p>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Proteína
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {parsedData.target_carbs}g
                </p>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Carbohidratos
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-rose-500">
                  {parsedData.target_fat}g
                </p>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Grasas
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                Comidas del día ({parsedData.meals.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {parsedData.meals.map((meal, index) => (
                  <div
                    key={index}
                    className="bg-card hover:border-primary/40 space-y-2 rounded-lg border p-4 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/15 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-semibold">
                        {meal.name || meal.meal_type}
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {meal.items.map((item, i) => (
                        <div
                          key={i}
                          className="border-border/40 flex items-center justify-between border-b py-1 text-sm last:border-0"
                        >
                          <span className="text-foreground/80">
                            {item.name}
                            {item.serving_equivalence ? (
                              <span className="text-muted-foreground text-xs ml-1.5 font-normal">
                                ({item.serving_equivalence})
                              </span>
                            ) : null}
                          </span>
                          <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-xs font-semibold">
                            {item.quantity_g}g
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Guardar como Dieta Activa
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
