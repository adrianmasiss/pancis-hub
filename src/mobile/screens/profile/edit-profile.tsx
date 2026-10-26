"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Camera, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  removeAvatar,
  updateGoalSettings,
  updateProfileSettings,
  updateToleranceSettings,
  updateUsername,
  uploadAvatar,
} from "@/features/settings/actions";
import {
  goalSettingsSchema,
  profileSettingsSchema,
  toleranceSettingsSchema,
  type GoalSettingsInput,
  type ProfileSettingsInput,
  type ToleranceSettingsInput,
} from "@/features/settings/schemas";
import { shrinkImage } from "@/features/foods/lib/prepare-image";
import { messages } from "@/i18n/es-419";
import { toOptionalNumber } from "@/lib/forms";
import { triggerHaptic } from "@/lib/haptics";
import { Segmented } from "@/mobile/ui/controls";
import { FormField, FormScreen, FormSection } from "@/mobile/ui/form-screen";

const t = messages.settings;
const f = messages.onboarding.fields;
const PERFIL = "/configuracion";

/* Un solo formulario para los cuatro grupos; al guardar sólo se llama a la
   acción de los grupos que cambiaron, con las mismas reglas de escritorio. */
const schema = profileSettingsSchema
  .extend(goalSettingsSchema.shape)
  .extend(toleranceSettingsSchema.shape)
  .extend({ username: z.string().trim() });

type Values = ProfileSettingsInput &
  GoalSettingsInput &
  ToleranceSettingsInput & { username: string };

const GRUPOS = {
  perfil: ["displayName", "heightCm", "unitSystem", "timezone"],
  objetivo: ["primaryGoal", "activityLevel"],
  margen: ["caloriesPct", "proteinPct", "carbsPct", "fatPct"],
  usuario: ["username"],
} as const satisfies Record<string, readonly (keyof Values)[]>;

const OBJETIVOS: { value: GoalSettingsInput["primaryGoal"]; label: string }[] =
  [
    { value: "recomposicion", label: f.goalRecomposition },
    { value: "perdida_grasa", label: f.goalFatLoss },
    { value: "ganancia_muscular", label: f.goalMuscleGain },
    { value: "mantenimiento", label: f.goalMaintenance },
  ];

const ACTIVIDAD: {
  value: GoalSettingsInput["activityLevel"];
  label: string;
}[] = [
  { value: "sedentario", label: f.sedentary },
  { value: "ligero", label: f.light },
  { value: "moderado", label: f.moderate },
  { value: "alto", label: f.high },
];

const MARGEN: { key: keyof ToleranceSettingsInput; label: string }[] = [
  { key: "caloriesPct", label: "Calorías" },
  { key: "proteinPct", label: "Proteína" },
  { key: "carbsPct", label: "Carbos" },
  { key: "fatPct", label: "Grasas" },
];

function iniciales(nombre: string) {
  return (
    nombre
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function EditProfileMobile({
  defaultValues,
  avatarUrl,
  notice,
  foodsToReview,
}: {
  defaultValues: Values;
  avatarUrl: string | null;
  /** Alimentos cuyas fuentes no coinciden; con alguno, se ofrece revisarlos. */
  foodsToReview: number;
  /** El aviso de recálculo de objetivos, si lo hay. */
  notice?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const errors = form.formState.errors;
  const [goal, activity, unitSystem, name] = useWatch({
    control: form.control,
    name: ["primaryGoal", "activityLevel", "unitSystem", "displayName"],
  });

  const guardar = form.handleSubmit((data) =>
    startTransition(async () => {
      const dirty = form.formState.dirtyFields as Partial<
        Record<keyof Values, boolean>
      >;
      const cambio = (g: keyof typeof GRUPOS) =>
        GRUPOS[g].some((k) => dirty[k]);

      const tareas: Promise<{ error: string } | { success: true }>[] = [];
      if (cambio("perfil")) tareas.push(updateProfileSettings(data));
      if (cambio("objetivo")) tareas.push(updateGoalSettings(data));
      if (cambio("margen")) tareas.push(updateToleranceSettings(data));
      if (cambio("usuario") && data.username !== defaultValues.username)
        tareas.push(updateUsername({ username: data.username }));

      if (tareas.length === 0) {
        router.replace(PERFIL);
        return;
      }
      const resultados = await Promise.all(tareas);
      const fallo = resultados.find((r) => "error" in r);
      if (fallo && "error" in fallo) {
        toast.error(fallo.error);
        return;
      }
      triggerHaptic("success");
      toast.success(t.saved);
      router.replace(PERFIL);
    }),
  );

  return (
    <FormScreen
      title="Editar perfil"
      back={PERFIL}
      backLabel="Volver a Perfil"
      onSubmit={guardar}
      footer={
        <button
          type="submit"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending}
        >
          {pending ? "Guardando…" : messages.common.save}
        </button>
      }
    >
      {notice}

      <AvatarPicker name={name} initial={avatarUrl} />

      <FormSection title="Tú">
        <FormField label={f.displayName} error={errors.displayName?.message}>
          <input
            className="m-input"
            autoComplete="name"
            {...form.register("displayName")}
          />
        </FormField>
        <FormField
          label={t.usernameLabel}
          hint="Con él entras en lugar del correo."
          error={errors.username?.message}
        >
          <input
            className="m-input"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tu.usuario"
            {...form.register("username")}
          />
        </FormField>
      </FormSection>

      <FormSection title="Cuerpo y unidades">
        <FormField label="Altura" error={errors.heightCm?.message}>
          <span className="m-input-unit">
            <input
              className="m-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              {...form.register("heightCm", { setValueAs: toOptionalNumber })}
            />
            <small>cm</small>
          </span>
        </FormField>
        <div className="m-field">
          <span>{f.unitSystem}</span>
          <Segmented
            label={f.unitSystem}
            value={unitSystem}
            onChange={(v) =>
              form.setValue("unitSystem", v, { shouldDirty: true })
            }
            options={[
              { value: "metric", label: "kg · cm" },
              { value: "imperial", label: "lb · in" },
            ]}
          />
        </div>
        <TimezoneField
          value={defaultValues.timezone}
          error={errors.timezone?.message}
          register={form.register("timezone")}
        />
      </FormSection>

      <FormSection title={t.goalsSection}>
        <p className="m-form-note">{t.goalsDescription}</p>
        <h3 className="m-field-label">{f.goal}</h3>
        <ChoiceList
          label={f.goal}
          value={goal}
          options={OBJETIVOS}
          onChange={(v) =>
            form.setValue("primaryGoal", v, { shouldDirty: true })
          }
        />
        <h3 className="m-field-label">{f.activityLevel}</h3>
        <ChoiceList
          label={f.activityLevel}
          value={activity}
          options={ACTIVIDAD}
          onChange={(v) =>
            form.setValue("activityLevel", v, { shouldDirty: true })
          }
        />
      </FormSection>

      <FormSection title={t.tolerances.title}>
        <p className="m-form-note">{t.tolerances.description}</p>
        <div className="m-form-grid">
          {MARGEN.map((m) => (
            <FormField
              key={m.key}
              label={m.label}
              error={errors[m.key]?.message}
            >
              <span className="m-input-unit">
                <input
                  className="m-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  {...form.register(m.key, { setValueAs: toOptionalNumber })}
                />
                <small>%</small>
              </span>
            </FormField>
          ))}
        </div>
        <small className="m-field-hint">{t.tolerances.fiberNote}</small>
      </FormSection>

      {foodsToReview > 0 && (
        <div className="m-pref-card">
          <Link
            href="/nutricion/alimentos/revisar"
            className="m-pref-row m-press"
          >
            <span className="m-pref-label">Fuentes que no coinciden</span>
            <span className="m-pref-value">
              {foodsToReview} {foodsToReview === 1 ? "alimento" : "alimentos"}
            </span>
            <ChevronRight size={18} className="m-chevron" aria-hidden="true" />
          </Link>
        </div>
      )}
    </FormScreen>
  );
}

/** Lista de opciones con check, para cuando no caben en un segmentado. */
function ChoiceList<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="m-radio-list" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className="m-radio-row m-press"
            onClick={() => {
              if (!active) triggerHaptic("selection");
              onChange(o.value);
            }}
          >
            {o.label}
            <span className="m-radio-dot" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/* La lista de zonas sale del navegador al tocar el selector: si la pintara
   el servidor, la de Node y la de Safari no siempre coinciden y la
   hidratación falla. */
function TimezoneField({
  value,
  error,
  register,
}: {
  value: string;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm<Values>>["register"]>;
}) {
  const [zonas, setZonas] = useState<string[]>([value]);
  const cargar = () => {
    if (zonas.length > 1) return;
    try {
      const todas = Intl.supportedValuesOf("timeZone");
      setZonas(todas.includes(value) ? todas : [value, ...todas]);
    } catch {
      /* Navegador viejo: se queda la zona actual. */
    }
  };
  return (
    <FormField label={f.timezone} error={error}>
      <select
        className="m-input"
        onPointerDown={cargar}
        onFocus={cargar}
        {...register}
      >
        {zonas.map((z) => (
          <option key={z} value={z}>
            {z.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </FormField>
  );
}

/** Foto de perfil: se sube o se quita al momento, como en escritorio. */
function AvatarPicker({
  name,
  initial,
}: {
  name: string;
  initial: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initial);
  const [pending, startTransition] = useTransition();

  const subir = (file: File | undefined) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    startTransition(async () => {
      /* Se ve a 44-112 px: 512 px en JPEG pesa ~40 KB en vez de varios MB,
         y la foto se carga en cada pantalla. */
      const data = new FormData();
      try {
        const blob = await shrinkImage(file, 512, "image/jpeg", 0.86);
        data.set(
          "avatar",
          new File([blob], "avatar.jpg", { type: blob.type }),
        );
      } catch {
        data.set("avatar", file);
      }
      const result = await uploadAvatar(data);
      if ("error" in result) {
        toast.error(result.error);
        setPreview(initial);
      } else {
        triggerHaptic("success");
        toast.success(t.avatarUploaded);
      }
      if (input.current) input.current.value = "";
    });
  };

  const quitar = () =>
    startTransition(async () => {
      const result = await removeAvatar();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPreview(null);
      toast.success(t.avatarRemoved);
    });

  return (
    <div className="m-avatar-edit">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => subir(e.target.files?.[0])}
      />
      <span
        className="m-avatar m-profile-avatar"
        data-busy={pending ? "" : undefined}
        aria-hidden="true"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada o blob local
          <img src={preview} alt="" />
        ) : (
          iniciales(name)
        )}
      </span>
      <div className="m-avatar-edit-actions">
        <button
          type="button"
          className="m-btn m-press"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          <Camera size={16} aria-hidden="true" />
          {preview ? "Cambiar foto" : t.avatarUpload}
        </button>
        {preview && (
          <button
            type="button"
            className="m-btn m-press"
            disabled={pending}
            onClick={quitar}
            aria-label={t.avatarRemove}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
