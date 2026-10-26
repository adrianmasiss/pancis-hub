"use client";

import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { DropZone } from "@/components/shared/form-kit";
import "./upload-diet-form.css";
import { DietReviewEditor } from "@/features/nutrition/components/diet-review-editor";
import {
  DIET_FILE_ACCEPT,
  useDietUpload,
} from "@/features/nutrition/components/use-diet-upload";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.aiDiet;

export function UploadDietForm() {
  const {
    file,
    isLoading,
    parsedData,
    suggestions,
    reviewKey,
    error,
    handleFileChange,
    handleParse,
  } = useDietUpload();

  return (
    <div className="space-y-6">
      <Section title={t.uploadTitle}>
        <DropZone
          accept={DIET_FILE_ACCEPT}
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
