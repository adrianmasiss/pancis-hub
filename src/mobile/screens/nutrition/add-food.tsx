"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, ImageUp, ScanText } from "lucide-react";
import { toast } from "sonner";
import { createCustomFood } from "@/features/foods/actions";
import { readNutritionLabel } from "@/features/foods/label-actions";
import type { LabelValues } from "@/features/foods/lib/nutrition-label";
import { prepareImage } from "@/features/foods/lib/prepare-image";
import {
  FOOD_GROUPS,
  foodFormSchema,
  type FoodFormInput,
} from "@/features/foods/schemas";
import { messages } from "@/i18n/es-419";
import { toOptionalNumber } from "@/lib/forms";
import { triggerHaptic } from "@/lib/haptics";
import { Segmented } from "@/mobile/ui/controls";
import { FormField, FormScreen, FormSection } from "@/mobile/ui/form-screen";

const t = messages.foods;
const BIBLIOTECA = "/nutricion?vista=biblioteca";

export type AddFoodMethod = "foto" | "manual";

type NumberKey =
  | "calories"
  | "proteinG"
  | "carbohydrateG"
  | "fatG"
  | "fiberG"
  | "sugarG"
  | "sodiumMg";

const NUTRIENTES: {
  key: NumberKey;
  label: string;
  unit: string;
  optional?: boolean;
}[] = [
  { key: "calories", label: "Energía", unit: "kcal" },
  { key: "proteinG", label: "Proteína", unit: "g" },
  { key: "carbohydrateG", label: "Carbos", unit: "g" },
  { key: "fatG", label: "Grasas", unit: "g" },
  { key: "fiberG", label: "Fibra", unit: "g" },
  { key: "sugarG", label: "Azúcar", unit: "g", optional: true },
  { key: "sodiumMg", label: "Sodio", unit: "mg", optional: true },
];

/**
 * Agregar un alimento en el telefono: foto de la etiqueta o a mano. Las dos
 * llenan el mismo formulario y nada se guarda hasta tocar «Guardar» —igual
 * que la hoja de escritorio, con sus mismas acciones de servidor—. El codigo
 * de barras tiene su propia pantalla (Escanear).
 */
export function AddFoodMobile({ method: inicial }: { method: AddFoodMethod }) {
  const router = useRouter();
  const [method, setMethod] = useState<AddFoodMethod>(inicial);
  const [nota, setNota] = useState<string | null>(null);
  const [leida, setLeida] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<FoodFormInput>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: { name: "", brand: "" },
  });
  const errors = form.formState.errors;
  const cooked = useWatch({ control: form.control, name: "cookedState" });

  const fromLabel = (
    values: LabelValues,
    basis: string,
    serving: number | null,
  ) => {
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === undefined || value === "") continue;
      form.setValue(key as keyof FoodFormInput, value as never, {
        shouldDirty: true,
      });
    }
    setNota(
      basis === "perServing" && serving
        ? `Leído de la etiqueta por porción de ${serving} g y convertido a 100 g. Revisa antes de guardar.`
        : basis === "per100ml"
          ? "Leído de la etiqueta por 100 ml. Revisa antes de guardar."
          : "Leído de la etiqueta. Revisa antes de guardar.",
    );
    setLeida(true);
  };

  const guardar = form.handleSubmit((data) =>
    startTransition(async () => {
      const result = await createCustomFood(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(t.created);
      router.replace(BIBLIOTECA);
    }),
  );

  const conFormulario = method === "manual" || leida;

  return (
    <FormScreen
      title="Agregar alimento"
      back={BIBLIOTECA}
      backLabel="Volver a la Biblioteca"
      onSubmit={guardar}
      footer={
        conFormulario ? (
          <button
            type="submit"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            disabled={pending}
          >
            {pending ? "Guardando…" : "Guardar alimento"}
          </button>
        ) : undefined
      }
    >
      <Segmented
        label="Cómo agregarlo"
        value={method}
        onChange={setMethod}
        options={[
          { value: "foto", label: "Foto de etiqueta" },
          { value: "manual", label: "Manual" },
        ]}
      />

      {method === "foto" && !leida && (
        <LabelPicker onRead={fromLabel} onManual={() => setMethod("manual")} />
      )}

      {conFormulario && (
        <>
          {nota && <p className="m-form-note">{nota}</p>}
          <FormSection>
            <FormField label={t.fields.name} error={errors.name?.message}>
              <input
                className="m-input"
                autoComplete="off"
                placeholder="Ej. Yogur griego natural"
                {...form.register("name")}
              />
            </FormField>
            <FormField label={t.fields.brand}>
              <input
                className="m-input"
                autoComplete="off"
                placeholder="Ej. Dos Pinos"
                {...form.register("brand")}
              />
            </FormField>
            <FormField label={t.fields.group} error={errors.foodGroup?.message}>
              <select
                className="m-input"
                defaultValue=""
                {...form.register("foodGroup")}
              >
                <option value="" disabled>
                  Elige un grupo
                </option>
                {FOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {t.groups[g]}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="m-field">
              <span>{t.fields.cookedState}</span>
              <Segmented
                label={t.fields.cookedState}
                value={cooked ?? "none"}
                onChange={(v) =>
                  form.setValue(
                    "cookedState",
                    v === "none" ? undefined : v,
                    { shouldDirty: true },
                  )
                }
                options={[
                  { value: "none", label: t.fields.stateNone },
                  { value: "crudo", label: "Crudo" },
                  { value: "cocido", label: "Cocido" },
                ]}
              />
            </div>
          </FormSection>

          <FormSection title="Por 100 g">
            <div className="m-form-grid">
              {NUTRIENTES.map((n) => (
                <FormField
                  key={n.key}
                  label={n.label}
                  optional={n.optional}
                  error={errors[n.key] ? "Revisa este valor" : undefined}
                >
                  <span className="m-input-unit">
                    <input
                      className="m-input"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      placeholder="—"
                      {...form.register(n.key, {
                        setValueAs: toOptionalNumber,
                      })}
                    />
                    <small>{n.unit}</small>
                  </span>
                </FormField>
              ))}
            </div>
          </FormSection>
        </>
      )}
    </FormScreen>
  );
}

/** Foto de la tabla nutricional → valores propuestos en el formulario. */
function LabelPicker({
  onRead,
  onManual,
}: {
  onRead: (values: LabelValues, basis: string, serving: number | null) => void;
  onManual: () => void;
}) {
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const leer = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setLeyendo(true);
    setError("");
    try {
      const result = await readNutritionLabel({
        imageBase64: await prepareImage(file),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      triggerHaptic("success");
      onRead(result.values, result.basis, result.servingSizeG);
    } catch {
      setError("No pudimos abrir esa imagen. Prueba con otra foto.");
    } finally {
      setLeyendo(false);
    }
  };

  const abrir = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.value = "";
    input.click();
  };

  return (
    <div className="m-label-pick">
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => void leer(e.target.files?.[0])}
      />
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void leer(e.target.files?.[0])}
      />

      <div className="m-label-frame" data-busy={leyendo ? "" : undefined}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista local (blob:)
          <img src={preview} alt="Foto de la etiqueta" />
        ) : (
          <ScanText size={40} strokeWidth={1.4} aria-hidden="true" />
        )}
        {leyendo && <span className="m-label-status">Leyendo la etiqueta…</span>}
      </div>

      <p className="m-sheet-text" style={{ textAlign: "center" }}>
        Encuadra la tabla nutricional completa, con buena luz. Te proponemos los
        valores y los revisas antes de guardar.
      </p>
      {error && (
        <p role="alert" className="m-field-error" style={{ textAlign: "center" }}>
          {error}
        </p>
      )}

      <div className="m-grid-2">
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          disabled={leyendo}
          onClick={() => abrir(camara.current)}
        >
          <Camera size={18} aria-hidden="true" />
          Tomar foto
        </button>
        <button
          type="button"
          className="m-btn m-press"
          disabled={leyendo}
          onClick={() => abrir(galeria.current)}
        >
          <ImageUp size={18} aria-hidden="true" />
          Galería
        </button>
      </div>
      <button
        type="button"
        className="m-link"
        style={{ alignSelf: "center" }}
        onClick={onManual}
      >
        Prefiero escribirlo a mano
      </button>
    </div>
  );
}
