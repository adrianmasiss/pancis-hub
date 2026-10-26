"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileText, History, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { DietReviewEditor } from "@/features/nutrition/components/diet-review-editor";
import {
  DIET_FILE_ACCEPT,
  useDietUpload,
} from "@/features/nutrition/components/use-diet-upload";
import {
  restoreDietVersion,
  saveDietVersion,
  type DietVersionList,
} from "@/features/nutrition/version-actions";
import { messages } from "@/i18n/es-419";
import { triggerHaptic } from "@/lib/haptics";
import { FormField, FormScreen, FormSection } from "@/mobile/ui/form-screen";
import { Sheet } from "@/mobile/ui/sheet";

const t = messages.nutrition.aiDiet;
const tv = messages.nutrition.versions;
const PLAN = "/nutricion?vista=plan";

/**
 * Subir el plan en el telefono: foto o archivo → la IA lo lee → lo revisas y
 * guardas. Mismo hook y mismas acciones que escritorio; abajo, las versiones
 * del plan activo para volver atras.
 */
export function DietUploadMobile({
  templateId,
  versions,
}: {
  templateId: string | null;
  versions: DietVersionList | null;
}) {
  const upload = useDietUpload();
  const camara = useRef<HTMLInputElement>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const { file, isLoading, parsedData, error } = upload;

  const abrir = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.value = "";
    input.click();
  };
  const elegir = (e: React.ChangeEvent<HTMLInputElement>) =>
    upload.handleFileChange(e.target.files?.[0] ?? null, e.target);

  return (
    <FormScreen
      title="Subir plan"
      back={PLAN}
      backLabel="Volver al plan"
      footer={
        parsedData ? undefined : (
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            disabled={!file || isLoading}
            onClick={() => void upload.handleParse()}
          >
            {isLoading ? t.analyzing : t.analyze}
          </button>
        )
      }
    >
      <p className="m-form-note">{t.pageDescription}</p>

      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={elegir}
      />
      <input
        ref={archivo}
        type="file"
        accept={DIET_FILE_ACCEPT}
        hidden
        onChange={elegir}
      />

      {file ? (
        <div className="m-file-chip" data-busy={isLoading ? "" : undefined}>
          <FileText size={20} aria-hidden="true" />
          <span>
            <strong>{file.name}</strong>
            <small>
              {isLoading
                ? "La IA está leyendo tu plan…"
                : `${Math.max(1, Math.round(file.size / 1024))} KB`}
            </small>
          </span>
          {!isLoading && (
            <button
              type="button"
              className="m-icon-btn m-press"
              aria-label="Quitar archivo"
              onClick={() => upload.handleFileChange(null, null)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className="m-label-pick">
          <div className="m-label-frame" data-shape="wide">
            <FileText size={40} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <p className="m-sheet-text" style={{ textAlign: "center" }}>
            {t.analyzeHint}
          </p>
          <div className="m-grid-2">
            <button
              type="button"
              className="m-btn m-press"
              data-variant="primary"
              onClick={() => abrir(camara.current)}
            >
              <Camera size={18} aria-hidden="true" />
              Tomar foto
            </button>
            <button
              type="button"
              className="m-btn m-press"
              onClick={() => abrir(archivo.current)}
            >
              <FileText size={18} aria-hidden="true" />
              Foto o PDF
            </button>
          </div>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="m-field-error"
          style={{ textAlign: "center" }}
        >
          {error}
        </p>
      )}

      {parsedData ? (
        <div className="m-forms m-diet-review">
          <DietReviewEditor
            key={upload.reviewKey}
            parsed={parsedData}
            suggestions={upload.suggestions}
          />
        </div>
      ) : null}

      {templateId && versions ? (
        <DietVersions templateId={templateId} initial={versions} />
      ) : null}
    </FormScreen>
  );
}

function DietVersions({
  templateId,
  initial,
}: {
  templateId: string;
  initial: DietVersionList;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<{
    id: string;
    version: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const delta = initial.pendingChanges?.caloriesDelta ?? 0;

  const guardar = () =>
    startTransition(async () => {
      const result = await saveDietVersion({ templateId, reason });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(tv.saved.replace("{version}", String(result.version)));
      setReason("");
      router.refresh();
    });

  const restaurar = (id: string) =>
    startTransition(async () => {
      const result = await restoreDietVersion({ versionId: id });
      setConfirm(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(tv.restored.replace("{version}", String(result.version)));
      router.refresh();
    });

  return (
    <FormSection title={tv.title}>
      <p className="m-field-hint">{tv.description}</p>
      {delta ? (
        <p className="m-form-note">
          {tv.caloriesDelta.replace(
            "{delta}",
            delta > 0 ? `+${delta}` : String(delta),
          )}
        </p>
      ) : null}
      <FormField label={tv.reason}>
        <input
          className="m-input"
          value={reason}
          placeholder={tv.reasonPlaceholder}
          onChange={(e) => setReason(e.target.value)}
        />
      </FormField>
      <button
        type="button"
        className="m-btn m-press"
        data-block=""
        disabled={pending}
        onClick={guardar}
      >
        <History size={18} aria-hidden="true" />
        {tv.save}
      </button>

      {initial.versions.length === 0 ? (
        <p className="m-field-hint">{tv.noVersions}</p>
      ) : (
        <ul className="m-version-list">
          {initial.versions.map((v) => (
            <li key={v.id}>
              <span>
                <strong>
                  {tv.versionLabel.replace("{version}", String(v.version))}
                </strong>
                <small>
                  {new Date(v.createdAt).toLocaleDateString("es", {
                    day: "numeric",
                    month: "short",
                  })}
                  {" · "}
                  {tv.summary
                    .replace("{meals}", String(v.mealCount))
                    .replace("{items}", String(v.itemCount))
                    .replace("{calories}", String(v.totalCalories))}
                </small>
                {v.reason && <small>{v.reason}</small>}
              </span>
              <button
                type="button"
                className="m-btn m-press"
                disabled={pending}
                onClick={() => setConfirm({ id: v.id, version: v.version })}
              >
                <RotateCcw size={16} aria-hidden="true" />
                {tv.restore}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm
            ? `${tv.restore} ${tv.versionLabel
                .replace("{version}", String(confirm.version))
                .toLowerCase()}`
            : tv.restore
        }
        description={tv.restoreConfirm}
      >
        <div className="m-grid-2">
          <button
            type="button"
            className="m-btn m-press"
            onClick={() => setConfirm(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={pending}
            onClick={() => confirm && restaurar(confirm.id)}
          >
            {tv.restore}
          </button>
        </div>
      </Sheet>
    </FormSection>
  );
}
