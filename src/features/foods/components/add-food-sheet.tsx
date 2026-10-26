"use client";

import { ActionButton } from "@/components/ui/action";
/* eslint-disable @next/next/no-img-element -- local object-URL previews and provider thumbnails */

import { SegmentedControl } from "@/components/shared/segmented-control";
import {
  FocusCardDescription,
  FocusCardHeader,
  FocusCardTitle,
} from "@/components/ui/focus-card";
import { createCustomFood, updateCustomFood } from "@/features/foods/actions";
import {
  findByBarcodeAction,
  importExternalFood,
} from "@/features/foods/external-actions";
import type { ExternalSearchResult } from "@/features/foods/external-queries";
import { readNutritionLabel } from "@/features/foods/label-actions";
import { prepareImage } from "@/features/foods/lib/prepare-image";
import {
  isValidBarcode,
  normalizeBarcode,
  toSearchableBarcode,
} from "@/features/foods/lib/barcode";
import type { LabelValues } from "@/features/foods/lib/nutrition-label";
import { useBarcodeCamera } from "@/features/foods/lib/use-barcode-camera";
import type { LibraryFood } from "@/features/foods/queries";
import {
  FOOD_GROUPS,
  foodFormSchema,
  type FoodFormInput,
} from "@/features/foods/schemas";
import { messages } from "@/i18n/es-419";
import { toOptionalNumber } from "@/lib/forms";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, ScanBarcode, ScanText, Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import "./add-food-sheet.css";

const t = messages.foods;

type Method = "label" | "barcode" | "manual";
type NumberKey =
  | "calories"
  | "proteinG"
  | "carbohydrateG"
  | "fatG"
  | "fiberG"
  | "sugarG"
  | "sodiumMg";

/** Where the values in the form came from; it decides how they are saved. */
type Origin =
  | { kind: "manual" }
  | { kind: "label"; basis: string; servingSizeG: number | null }
  | { kind: "barcode"; product: ExternalSearchResult };

const NUTRIENTS: {
  key: NumberKey;
  label: string;
  unit: string;
  tone: string;
  optional?: boolean;
}[] = [
  { key: "calories", label: "Energía", unit: "kcal", tone: "energy" },
  { key: "proteinG", label: "Proteína", unit: "g", tone: "protein" },
  { key: "carbohydrateG", label: "Carbohidratos", unit: "g", tone: "carbs" },
  { key: "fatG", label: "Grasas", unit: "g", tone: "fat" },
  { key: "fiberG", label: "Fibra", unit: "g", tone: "fiber" },
  { key: "sugarG", label: "Azúcar", unit: "g", tone: "sugar", optional: true },
  {
    key: "sodiumMg",
    label: "Sodio",
    unit: "mg",
    tone: "sodium",
    optional: true,
  },
];

const METHODS = [
  {
    id: "label" as const,
    label: "Leer la etiqueta",
    short: "Etiqueta",
    icon: <ScanText size={16} strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    id: "barcode" as const,
    label: "Código de barras",
    short: "Código",
    icon: <ScanBarcode size={16} strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    id: "manual" as const,
    label: "Escribir a mano",
    short: "Manual",
    icon: <PencilLine size={16} strokeWidth={1.75} aria-hidden="true" />,
  },
];

/**
 * The single way to add (or edit) a food anywhere in the app. Three ways
 * in, one form out: read the nutrition label from a photo, scan the
 * barcode, or type it. Nothing is saved on its own: every way fills the same
 * form, the person reviews it, and only then saves.
 */
export function AddFoodSheet({
  food,
  onDone,
}: {
  food?: LibraryFood;
  onDone: (name?: string) => void;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [method, setMethod] = useState<Method>("label");
  const [origin, setOrigin] = useState<Origin | null>(
    food ? { kind: "manual" } : null,
  );
  /** Bumped on every fill so the highlight replays on the fields it touched. */
  const [fillSeq, setFillSeq] = useState(0);
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const form = useForm<FoodFormInput>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: food
      ? {
          name: food.name,
          brand: food.brand ?? "",
          foodGroup: food.foodGroup,
          cookedState: food.cookedState ?? undefined,
          calories: food.calories,
          proteinG: food.proteinG,
          carbohydrateG: food.carbohydrateG,
          fatG: food.fatG,
          fiberG: food.fiberG,
          sugarG: food.sugarG ?? undefined,
          sodiumMg: food.sodiumMg ?? undefined,
        }
      : { name: "", brand: "" },
  });
  const errors = form.formState.errors;
  const cookedState = useWatch({ control: form.control, name: "cookedState" });

  const fill = useCallback(
    (values: Partial<FoodFormInput>, next: Origin) => {
      const touched = new Set<string>();
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === undefined || value === "") continue;
        form.setValue(key as keyof FoodFormInput, value as never, {
          shouldDirty: true,
        });
        touched.add(key);
      }
      setFilled(touched);
      setFillSeq((n) => n + 1);
      setOrigin(next);
    },
    [form],
  );

  const fromLabel = useCallback(
    (values: LabelValues, basis: string, servingSizeG: number | null) => {
      fill(
        {
          name: values.name ?? undefined,
          brand: values.brand ?? undefined,
          foodGroup: values.foodGroup ?? undefined,
          calories: values.calories ?? undefined,
          proteinG: values.proteinG ?? undefined,
          carbohydrateG: values.carbohydrateG ?? undefined,
          fatG: values.fatG ?? undefined,
          fiberG: values.fiberG ?? undefined,
          sugarG: values.sugarG ?? undefined,
          sodiumMg: values.sodiumMg ?? undefined,
        },
        { kind: "label", basis, servingSizeG },
      );
    },
    [fill],
  );

  const fromProduct = useCallback(
    (product: ExternalSearchResult) => {
      fill(
        {
          name: product.name,
          brand: product.brand ?? undefined,
          foodGroup: product.foodGroup,
          cookedState: product.cookedState ?? undefined,
          calories: product.per100g.calories,
          proteinG: product.per100g.proteinG,
          carbohydrateG: product.per100g.carbohydrateG,
          fatG: product.per100g.fatG,
          fiberG: product.per100g.fiberG,
          sugarG: product.sugarG ?? undefined,
          sodiumMg: product.sodiumMg ?? undefined,
        },
        { kind: "barcode", product },
      );
    },
    [fill],
  );

  const onSubmit = (data: FoodFormInput) => {
    startTransition(async () => {
      // A scanned product keeps its source unless its numbers were changed:
      // then it is no longer Open Food Facts' data but the person's.
      if (origin?.kind === "barcode") {
        const p = origin.product;
        const same = (a: number | undefined, b: number | null) =>
          (a ?? null) === (b === null ? null : Number(b));
        const untouched =
          same(data.calories, p.per100g.calories) &&
          same(data.proteinG, p.per100g.proteinG) &&
          same(data.carbohydrateG, p.per100g.carbohydrateG) &&
          same(data.fatG, p.per100g.fatG) &&
          same(data.fiberG, p.per100g.fiberG);
        if (untouched) {
          const result = await importExternalFood({
            source: p.source,
            externalId: p.externalId,
            displayName: data.name,
            foodGroup: data.foodGroup,
          });
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          toast.success(
            result.alreadyExisted
              ? t.external.alreadyInLibrary
              : t.external.imported,
          );
          router.refresh();
          onDone(data.name);
          return;
        }
      }
      const result = food
        ? await updateCustomFood({ ...data, foodId: food.id })
        : await createCustomFood(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(food ? t.updated : t.created);
      router.refresh();
      onDone(data.name);
    });
  };

  const showForm = Boolean(food) || method === "manual" || origin !== null;
  const originNote =
    origin?.kind === "label"
      ? origin.basis === "perServing" && origin.servingSizeG
        ? `Leído de la etiqueta por porción de ${origin.servingSizeG} g y convertido a 100 g.`
        : origin.basis === "per100ml"
          ? "Leído de la etiqueta por 100 ml. Revisa antes de guardar."
          : "Leído de la etiqueta. Revisa antes de guardar."
      : origin?.kind === "barcode"
        ? "De Open Food Facts. Si cambias los números, se guarda como tuyo."
        : null;

  return (
    <>
      <FocusCardHeader>
        <FocusCardTitle>
          <span className="afs-title-icon" aria-hidden="true">
            {food ? (
              <PencilLine size={17} strokeWidth={1.6} />
            ) : (
              <ScanText size={17} strokeWidth={1.6} />
            )}
          </span>
          {food ? t.editFood : "Agregar alimento"}
        </FocusCardTitle>
        <FocusCardDescription>
          {food
            ? "Valores por 100 g."
            : "Valores por 100 g. Revisas todo antes de guardar."}
        </FocusCardDescription>
      </FocusCardHeader>

      <div className="afs-body">
        {!food && (
          <SegmentedControl
            className="afs-methods"
            options={METHODS}
            active={method}
            onSelect={setMethod}
            disabled={pending}
          />
        )}

        {!food && method !== "manual" && (
          <motion.div
            key={method}
            className="afs-stage"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          >
            {method === "label" ? (
              <LabelPane
                onRead={fromLabel}
                onManual={() => setMethod("manual")}
              />
            ) : (
              <BarcodePane
                onFound={fromProduct}
                onSwitch={(next) => setMethod(next)}
              />
            )}
          </motion.div>
        )}

        {showForm && (
          <motion.form
            key={food ? "edit" : "form"}
            className="afs-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.34 }}
          >
            {originNote && (
              <p className="afs-origin" data-kind={origin?.kind}>
                {originNote}
              </p>
            )}

            <div className="afs-identity">
              <Field
                label={t.fields.name}
                error={errors.name?.message}
                filled={filled.has("name")}
                seq={fillSeq}
                wide
              >
                <input
                  className="afs-input afs-input-name"
                  autoComplete="off"
                  placeholder="Ej. Yogur griego natural"
                  {...form.register("name")}
                />
              </Field>
              <Field
                label={t.fields.brand}
                error={errors.brand?.message}
                filled={filled.has("brand")}
                seq={fillSeq}
              >
                <input
                  className="afs-input"
                  autoComplete="off"
                  placeholder="Ej. Dos Pinos"
                  {...form.register("brand")}
                />
              </Field>
              <Field
                label={t.fields.group}
                error={errors.foodGroup?.message}
                filled={filled.has("foodGroup")}
                seq={fillSeq}
              >
                <select
                  className="afs-input afs-select"
                  defaultValue=""
                  {...form.register("foodGroup")}
                >
                  <option value="" disabled>
                    Elige un grupo
                  </option>
                  {FOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {t.groups[group]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="afs-field afs-field-wide">
                <span className="afs-label">{t.fields.cookedState}</span>
                <SegmentedControl
                  className="afs-state"
                  options={[
                    { id: "none", label: t.fields.stateNone },
                    { id: "crudo", label: "Crudo" },
                    { id: "cocido", label: "Cocido" },
                  ]}
                  active={cookedState ?? "none"}
                  onSelect={(value) =>
                    form.setValue(
                      "cookedState",
                      value === "none" ? undefined : value,
                      { shouldDirty: true },
                    )
                  }
                />
              </div>
            </div>

            <fieldset className="afs-nutrients">
              <legend>Por 100 g</legend>
              {NUTRIENTS.map((nutrient) => (
                <label
                  key={`${nutrient.key}-${filled.has(nutrient.key) ? fillSeq : 0}`}
                  className="afs-nutrient"
                  data-tone={nutrient.tone}
                  data-filled={filled.has(nutrient.key) || undefined}
                  data-invalid={errors[nutrient.key] ? true : undefined}
                >
                  <span className="afs-nutrient-name">
                    {nutrient.label}
                    {nutrient.optional && (
                      <small className="afs-optional">opcional</small>
                    )}
                  </span>
                  <span className="afs-nutrient-value">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      placeholder="—"
                      aria-label={`${nutrient.label} por 100 g`}
                      {...form.register(nutrient.key, {
                        setValueAs: toOptionalNumber,
                      })}
                    />
                    <small>{nutrient.unit}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            {NUTRIENTS.some((n) => errors[n.key]) && (
              <p role="alert" className="afs-error">
                Revisa los valores marcados: deben ser números dentro de lo
                posible por 100 g.
              </p>
            )}

            <div className="afs-actions">
              <ActionButton
                family="save"
                loading={pending}
                className="w-full"
                type="submit"
                disabled={pending}
              >
                {food ? messages.common.save : "Guardar alimento"}
              </ActionButton>
            </div>
          </motion.form>
        )}
      </div>
    </>
  );
}

function Field({
  label,
  error,
  filled,
  seq,
  wide,
  children,
}: {
  label: string;
  error?: string;
  filled: boolean;
  seq: number;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      key={filled ? seq : 0}
      className={wide ? "afs-field afs-field-wide" : "afs-field"}
      data-filled={filled || undefined}
      data-invalid={error ? true : undefined}
    >
      <span className="afs-label">{label}</span>
      {children}
      {error && <span className="afs-field-error">{error}</span>}
    </label>
  );
}

/** Photo of the nutrition label → values in the form. */
function LabelPane({
  onRead,
  onManual,
}: {
  onRead: (values: LabelValues, basis: string, serving: number | null) => void;
  onManual: () => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "reading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const read = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setState("reading");
    setError("");
    try {
      const imageBase64 = await prepareImage(file);
      const result = await readNutritionLabel({ imageBase64 });
      if ("error" in result) {
        setError(result.error);
        setState("error");
        return;
      }
      onRead(result.values, result.basis, result.servingSizeG);
      setState("done");
    } catch {
      setError("No pudimos abrir esa imagen. Prueba con otra foto.");
      setState("error");
    }
  };

  const pick = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.value = "";
    input.click();
  };

  return (
    <div
      className="afs-pane afs-label-pane"
      data-state={state}
      data-dragging={dragging || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void read(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => void read(event.target.files?.[0])}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => void read(event.target.files?.[0])}
      />

      {preview ? (
        <div className="afs-preview" aria-busy={state === "reading"}>
          <img src={preview} alt="Foto de la etiqueta" />
          {state === "reading" && (
            <span className="afs-sweep" aria-hidden="true" />
          )}
        </div>
      ) : (
        <span className="afs-pane-glyph" aria-hidden="true">
          <ScanText size={30} strokeWidth={1.3} />
        </span>
      )}

      <div className="afs-pane-copy" aria-live="polite">
        {state === "idle" && (
          <>
            <p className="afs-pane-title">Fotografía la tabla nutricional</p>
            <p className="afs-pane-sub">
              Leemos energía, macros, azúcar y sodio. Si viene por porción, lo
              pasamos a 100 g.
            </p>
          </>
        )}
        {state === "reading" && (
          <p className="afs-pane-title">Leyendo la etiqueta…</p>
        )}
        {state === "done" && (
          <p className="afs-pane-title">Listo. Revisa los valores abajo.</p>
        )}
        {state === "error" && (
          <p className="afs-pane-title afs-pane-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="afs-pane-actions">
        {state !== "reading" && (
          <>
            <ActionButton
              family="add"
              className="afs-camera-only"
              type="button"
              onClick={() => pick(cameraInput.current)}
            >
              {state === "idle" ? "Tomar foto" : "Otra foto"}
            </ActionButton>
            <ActionButton
              family="add"
              type="button"
              onClick={() => pick(fileInput.current)}
            >
              {state === "idle" ? "Elegir imagen" : "Otra imagen"}
            </ActionButton>
          </>
        )}
        {state === "error" && (
          <button type="button" className="afs-link" onClick={onManual}>
            Escribir a mano
          </button>
        )}
      </div>
      {state === "idle" && (
        <p className="afs-drop-hint">o suelta la imagen aquí</p>
      )}
    </div>
  );
}

/** Live barcode scan (or typed code) → Open Food Facts → values in the form. */
function BarcodePane({
  onFound,
  onSwitch,
}: {
  onFound: (product: ExternalSearchResult) => void;
  onSwitch: (method: Method) => void;
}) {
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<ExternalSearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useCallback(
    async (raw: string) => {
      const normalized = normalizeBarcode(raw);
      if (!isValidBarcode(normalized)) {
        toast.error(t.barcode.invalidCode);
        return;
      }
      setSearching(true);
      setNotFound(false);
      const found = await findByBarcodeAction(toSearchableBarcode(normalized));
      setSearching(false);
      if (!found) {
        setNotFound(true);
        return;
      }
      setProduct(found);
      onFound(found);
    },
    [onFound],
  );

  const {
    videoRef,
    supportsCamera,
    error: cameraError,
    start,
    stop,
  } = useBarcodeCamera((value) => void lookup(value));

  // The camera runs only while this pane is open and nothing is found yet.
  useEffect(() => {
    if (supportsCamera && !product) void start();
    return stop;
  }, [supportsCamera, product, start, stop]);

  return (
    <div className="afs-pane afs-barcode-pane">
      {product ? (
        <div className="afs-product">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="afs-product-img" />
          ) : (
            <span className="afs-product-img" aria-hidden="true">
              <ScanBarcode size={20} strokeWidth={1.5} />
            </span>
          )}
          <span className="afs-product-text">
            <strong>{product.name}</strong>
            <small>
              {[product.brand, "Open Food Facts"].filter(Boolean).join(" · ")}
            </small>
          </span>
          <button
            type="button"
            className="afs-link"
            onClick={() => {
              setProduct(null);
              setCode("");
            }}
          >
            Escanear otro
          </button>
        </div>
      ) : (
        <>
          {supportsCamera && (
            <div className="afs-viewfinder">
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label={t.barcode.cameraLabel}
              />
              <span className="afs-reticle" aria-hidden="true" />
            </div>
          )}
          <p className="afs-pane-sub" aria-live="polite">
            {cameraError ??
              (supportsCamera ? t.barcode.aiming : t.barcode.noCameraSupport)}
          </p>
          <form
            className="afs-code-row"
            onSubmit={(event) => {
              event.preventDefault();
              void lookup(code);
            }}
          >
            <input
              className="afs-input"
              inputMode="numeric"
              autoComplete="off"
              placeholder="O escribe el código: 7501000111145"
              aria-label={t.barcode.manualLabel}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <button
              type="submit"
              className="afs-secondary"
              disabled={searching || !code.trim()}
            >
              <Search size={15} strokeWidth={1.75} aria-hidden="true" />
              {searching ? "Buscando…" : t.barcode.search}
            </button>
          </form>
          {notFound && (
            <div className="afs-notfound" role="status">
              <p>Open Food Facts no tiene ese producto.</p>
              <span>
                <button
                  type="button"
                  className="afs-link"
                  onClick={() => onSwitch("label")}
                >
                  Leer la etiqueta
                </button>
                <button
                  type="button"
                  className="afs-link"
                  onClick={() => onSwitch("manual")}
                >
                  Escribir a mano
                </button>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
