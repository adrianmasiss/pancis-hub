"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChartColumn,
  FileUp,
  ImagePlus,
  ScanLine,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { MeasurementView } from "@/features/progress/queries";
import {
  readInbodyReport,
  saveInbodyReading,
  type InbodyReading,
} from "@/features/progress/inbody-actions";
import { uploadProgressPhoto } from "@/features/progress/actions";
import { MeasurementFormDialog } from "@/features/progress/components/measurement-form-dialog";
import { PhotoUploadDialog } from "@/features/progress/components/photo-upload-dialog";
import { shrinkImage } from "@/features/foods/lib/prepare-image";
import { triggerHaptic } from "@/lib/haptics";
import { Fab } from "@/mobile/ui/fab";
import { Sheet } from "@/mobile/ui/sheet";
import { useUnits } from "@/mobile/units";
import { num } from "./format";

/**
 * El «+» de Progreso: medicion a mano, importar el informe del InBody (la IA
 * lo lee) o subir una foto de progreso.
 */
export function ProgressFab({
  measurements,
  today,
  aiEnabled,
}: {
  measurements: MeasurementView[];
  today: string;
  aiEnabled: boolean;
}) {
  const [abierto, setAbierto] = useState<"manual" | "inbody" | "foto" | null>(
    null,
  );
  const cerrar = (o: boolean) => !o && setAbierto(null);
  return (
    <>
      <Fab
        label="Agregar a Progreso"
        actions={[
          {
            label: "Medición manual",
            sub: "Peso, grasa o medidas",
            icon: ChartColumn,
            onClick: () => setAbierto("manual"),
          },
          {
            label: "Importar InBody",
            sub: aiEnabled
              ? "Foto o PDF · la IA lo lee"
              : "La IA no está disponible",
            icon: ScanLine,
            tone: "ia",
            disabled: !aiEnabled,
            onClick: () => setAbierto("inbody"),
          },
          {
            label: "Foto de progreso",
            sub: "Frente, lado y espalda",
            icon: Camera,
            onClick: () => setAbierto("foto"),
          },
        ]}
      />
      <MeasurementFormDialog
        open={abierto === "manual"}
        onOpenChange={cerrar}
      />
      <PhotoUploadDialog
        open={abierto === "foto"}
        onOpenChange={cerrar}
        defaultMeasurementId={measurements[0]?.id}
        measurements={measurements.map((m) => ({
          id: m.id,
          measuredAt: m.measuredAt,
        }))}
      />
      <Sheet
        open={abierto === "inbody"}
        onOpenChange={cerrar}
        title="Importar InBody"
        description="Toma una foto de la hoja de resultados o sube el PDF. La IA copia las cifras, tú las revisas y puedes sumar tus fotos de ese día."
      >
        {abierto === "inbody" && (
          <InbodyImport today={today} onDone={() => setAbierto(null)} />
        )}
      </Sheet>
    </>
  );
}

type Pose = "frontal" | "lateral" | "posterior";
type Foto = { file: File; url: string };
const POSES: { id: Pose; label: string }[] = [
  { id: "frontal", label: "Frente" },
  { id: "lateral", label: "Lado" },
  { id: "posterior", label: "Espalda" },
];

/**
 * Las fotos del dia del escaneo, opcionales: se guardan colgadas de el, asi
 * cada foto dice con que peso y grasa se tomo.
 */
function FotosDelEscaneo({
  fotos,
  onChange,
}: {
  fotos: Partial<Record<Pose, Foto>>;
  onChange: (pose: Pose, file: File | null) => void;
}) {
  return (
    <fieldset className="m-prog-photo-slots">
      <legend className="m-field-label">Fotos de ese día (opcional)</legend>
      <div>
        {POSES.map((p) => {
          const foto = fotos[p.id];
          return (
            <div
              key={p.id}
              className="m-prog-photo-slot"
              data-filled={foto ? "" : undefined}
            >
              <label className="m-press">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) onChange(p.id, f);
                  }}
                />
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element -- vista previa local
                  <img
                    src={foto.url}
                    alt={`Foto de ${p.label.toLowerCase()}`}
                  />
                ) : (
                  <ImagePlus size={20} aria-hidden="true" />
                )}
                <span>{p.label}</span>
              </label>
              {foto && (
                <button
                  type="button"
                  className="m-prog-photo-remove"
                  aria-label={`Quitar la foto de ${p.label.toLowerCase()}`}
                  onClick={() => onChange(p.id, null)}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

const FILAS: { key: keyof InbodyReading; label: string; unit?: string }[] = [
  { key: "weightKg", label: "Peso", unit: "kg" },
  { key: "skeletalMuscleKg", label: "Masa muscular", unit: "kg" },
  { key: "bodyFatPercentage", label: "% de grasa", unit: "%" },
  { key: "visceralFatLevel", label: "Grasa visceral", unit: "nivel" },
  { key: "totalBodyWaterL", label: "Agua corporal", unit: "L" },
  { key: "basalMetabolicRateKcal", label: "Metabolismo basal", unit: "kcal" },
  { key: "bmi", label: "IMC" },
  { key: "inbodyScore", label: "Puntaje InBody" },
];

function InbodyImport({
  today,
  onDone,
}: {
  today: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const u = useUnits();
  const input = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [lectura, setLectura] = useState<InbodyReading | null>(null);
  const [fecha, setFecha] = useState(today);
  const [fotos, setFotos] = useState<Partial<Record<Pose, Foto>>>({});
  const [leyendo, startLeer] = useTransition();
  const [guardando, startGuardar] = useTransition();
  // Las vistas previas son URL locales: se sueltan al salir.
  const vivas = useRef(fotos);
  useEffect(() => {
    vivas.current = fotos;
  }, [fotos]);
  useEffect(
    () => () =>
      Object.values(vivas.current).forEach((f) => URL.revokeObjectURL(f.url)),
    [],
  );

  const leer = (file: File) =>
    startLeer(async () => {
      // La foto viaja reducida (la hoja se lee bien a 2000 px); el PDF, tal cual.
      const listo =
        file.type === "application/pdf"
          ? file
          : new File([await shrinkImage(file, 2000)], "inbody.jpg", {
              type: "image/jpeg",
            });
      const fd = new FormData();
      fd.set("file", listo);
      const r = await readInbodyReport(fd);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      triggerHaptic("success");
      setArchivo(listo);
      setLectura(r.reading);
      if (r.reading.measuredAt && r.reading.measuredAt <= today)
        setFecha(r.reading.measuredAt);
    });

  const guardar = () =>
    startGuardar(async () => {
      if (!lectura) return;
      const fd = new FormData();
      fd.set("reading", JSON.stringify({ ...lectura, measuredAt: fecha }));
      if (archivo) fd.set("file", archivo);
      const r = await saveInbodyReading(fd);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      // Las fotos cuelgan del escaneo: quedan como respaldo de sus cifras.
      let fallidas = 0;
      for (const [pose, foto] of Object.entries(fotos) as [Pose, Foto][]) {
        const f = new FormData();
        f.set(
          "file",
          new File([await shrinkImage(foto.file, 2000)], `${pose}.jpg`, {
            type: "image/jpeg",
          }),
        );
        f.set("viewType", pose);
        f.set("capturedAt", fecha);
        f.set("measurementId", r.id);
        const subida = await uploadProgressPhoto(f);
        if ("error" in subida) fallidas++;
      }
      triggerHaptic("success");
      if (fallidas > 0)
        toast.error(
          `Escaneo guardado, pero ${fallidas === 1 ? "una foto no se pudo subir" : `${fallidas} fotos no se pudieron subir`}. Súbela desde «+».`,
        );
      else toast.success("Escaneo guardado.");
      onDone();
      router.refresh();
    });

  const elegir = (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) leer(f);
        }}
      />
      <button
        type="button"
        className="m-btn m-press"
        data-variant={lectura ? undefined : "primary"}
        data-block=""
        disabled={leyendo || guardando}
        onClick={() => input.current?.click()}
      >
        <FileUp size={17} aria-hidden="true" />
        {leyendo
          ? "Leyendo el informe…"
          : lectura
            ? "Elegir otro archivo"
            : "Elegir foto o PDF"}
      </button>
    </>
  );

  if (!lectura) {
    return (
      <div className="m-stack" style={{ gap: 12 }}>
        {leyendo && (
          <div className="m-prog-reading" role="status">
            <span className="m-prog-reading-bar" aria-hidden="true" />
            La IA está copiando las cifras de tu informe…
          </div>
        )}
        {elegir}
      </div>
    );
  }

  const filas = FILAS.filter((f) => lectura[f.key] !== null);
  return (
    <div className="m-stack" style={{ gap: 12 }}>
      <label className="m-field">
        <span>Fecha del escaneo</span>
        <input
          className="m-input"
          type="date"
          value={fecha}
          max={today}
          onChange={(e) => setFecha(e.target.value)}
        />
      </label>
      <dl className="m-dish-table-rows">
        {filas.map((f) => {
          const v = lectura[f.key] as number;
          return (
            <div key={f.key}>
              <dt>{f.label}</dt>
              <dd className="m-num">
                {f.unit === "kg" ? u.fmtWeight(v) : num(v)}{" "}
                {f.unit === "kg" ? u.weightUnit : (f.unit ?? "")}
              </dd>
            </div>
          );
        })}
      </dl>
      <FotosDelEscaneo
        fotos={fotos}
        onChange={(pose, file) =>
          setFotos((prev) => {
            const antes = prev[pose];
            if (antes) URL.revokeObjectURL(antes.url);
            const next = { ...prev };
            if (file) next[pose] = { file, url: URL.createObjectURL(file) };
            else delete next[pose];
            return next;
          })
        }
      />
      <p className="m-sub" style={{ fontSize: 12 }}>
        Compáralas con tu hoja. Si alguna no coincide, la corriges después en
        Escaneos.
        {lectura.segments.length > 0 &&
          ` Incluye el análisis por segmentos (${lectura.segments.length}).`}
      </p>
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        disabled={guardando || leyendo || !fecha}
        onClick={guardar}
      >
        {guardando ? "Guardando…" : "Guardar escaneo"}
      </button>
      {elegir}
    </div>
  );
}
