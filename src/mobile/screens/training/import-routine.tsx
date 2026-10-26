"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  FileUp,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { markNav } from "@/mobile/nav-direction";
import {
  extractRoutinePdf,
  extractRoutineWithAi,
  importRoutine,
  previewRoutineImport,
  type ImportExercisePreview,
  type ImportPreview,
} from "@/features/training/import-actions";
import { triggerHaptic } from "@/lib/haptics";
import { SwipeRow } from "@/mobile/ui/swipe-row";
import { ExerciseValuesSheet, ReplaceScreen, scheme } from "./routine-edit-kit";

type Row = ImportExercisePreview & { omit?: boolean };
type Day = { name: string; note: string | null; exercises: Row[] };

/** Igual que el servidor: sin series, o sin reps y sin «al fallo». */
const incompleto = (e: Row) =>
  !e.sets || (!e.repsMin && !/fallo|seg|min|tiempo|amrap/i.test(e.notes ?? ""));
const dudosa = (e: Row) => !e.omit && (!e.matchedId || incompleto(e));

/**
 * Importar rutina del coach. Paso 1: el PDF, la foto (con IA) o el texto.
 * Paso 2: lo que se entendio, por dia; las filas dudosas van en amarillo y
 * hay que corregirlas (u omitirlas) antes de que se habilite «Guardar».
 * Cada fila se desliza para Reemplazar o Eliminar; el lapiz abre las ruedas
 * del editor de rutina (routine-edit-kit.tsx).
 */
export function ImportRoutine({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [fixing, setFixing] = useState<[number, number] | null>(null);
  const [replacing, setReplacing] = useState<[number, number] | null>(null);
  const [pending, startTransition] = useTransition();

  const show = (result: ImportPreview) => {
    setPreview(result);
    setDays(result.days);
  };

  const readFile = (f: File) =>
    startTransition(async () => {
      setFile(f.name);
      if (!name)
        setName(
          f.name
            .replace(/\.[a-z0-9]+$/i, "")
            .replace(/[_-]+/g, " ")
            .trim(),
        );
      const form = new FormData();
      form.append("file", f);
      if (aiEnabled) {
        // Si la IA falla con un PDF, el servidor lee su texto sin ella.
        form.append("respaldo", "texto");
        const result = await extractRoutineWithAi(form);
        if ("error" in result) toast.error(result.error);
        else {
          if (result.readBy === "texto")
            toast.info(
              "La IA no respondió, así que se leyó el texto del PDF. Revisa las filas marcadas.",
            );
          show(result);
        }
        return;
      }
      const result = await extractRoutinePdf(form);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setText(result.text);
      const parsed = await previewRoutineImport({ text: result.text });
      if ("error" in parsed) toast.error(parsed.error);
      else show(parsed);
    });

  const analyze = () =>
    startTransition(async () => {
      const result = await previewRoutineImport({ text });
      if ("error" in result) toast.error(result.error);
      else {
        if (!name) setName("Rutina del coach");
        show(result);
      }
    });

  const edit = (d: number, i: number, patch: Partial<Row>) =>
    setDays((all) =>
      all.map((day, di) =>
        di !== d
          ? day
          : {
              ...day,
              exercises: day.exercises.map((e, ei) =>
                ei === i ? { ...e, ...patch } : e,
              ),
            },
      ),
    );

  /** «Eliminar» lo omite (y «Deshacer» lo devuelve). */
  const remove = (d: number, i: number) => {
    const e = days[d]?.exercises[i];
    edit(d, i, { omit: true });
    toast(`${e?.matchedName ?? e?.rawName ?? "Ejercicio"} eliminado`, {
      action: { label: "Deshacer", onClick: () => edit(d, i, { omit: false }) },
    });
  };

  const rows = days.flatMap((d) => d.exercises);
  const pendientes = rows.filter(dudosa).length;

  const save = () =>
    startTransition(async () => {
      const result = await importRoutine({
        name: name.trim() || "Rutina del coach",
        notes: preview?.notes ?? [],
        days: days.map((day) => ({
          name: day.name.trim() || "Día",
          note: day.note,
          exercises: day.exercises
            .filter((e) => !e.omit)
            .map((e) => ({ ...e, omit: undefined })),
        })),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Rutina importada.");
      router.push("/entrenamiento?vista=rutinas");
    });

  const fixRow = fixing ? days[fixing[0]]?.exercises[fixing[1]] : null;
  const replaceRow = replacing
    ? days[replacing[0]]?.exercises[replacing[1]]
    : null;

  return (
    <div className="m-screen" data-m-fullscreen="" style={{ paddingBottom: 0 }}>
      <div className="m-step-head">
        {preview ? (
          <button
            type="button"
            aria-label="Volver"
            className="m-icon-btn m-press"
            onClick={() => setPreview(null)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/entrenamiento?vista=rutinas"
            aria-label="Volver"
            className="m-icon-btn m-press"
            onClick={() => markNav("back")}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
        )}
        <div>
          <div className="m-sub">
            {preview ? "Paso 2 de 2 · Revisa" : "Paso 1 de 2"}
          </div>
          <h1 className="m-title" style={{ fontSize: 26 }}>
            Importar rutina
          </h1>
        </div>
      </div>

      {!preview ? (
        <div className="m-body m-stagger">
          <input
            ref={fileRef}
            type="file"
            hidden
            accept={aiEnabled ? "application/pdf,image/*" : "application/pdf"}
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) readFile(f);
              ev.target.value = "";
            }}
          />
          <button
            type="button"
            className="m-card m-press"
            data-glow=""
            style={{ alignItems: "center", textAlign: "center", padding: 24 }}
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp size={32} className="m-accent-text" aria-hidden="true" />
            <span className="m-card-title">
              {pending
                ? "Leyendo…"
                : aiEnabled
                  ? "Sube el PDF o una foto"
                  : "Sube el PDF"}
            </span>
            <span className="m-sub">
              {aiEnabled
                ? "La IA lee ejercicios, series, reps y RIR. Revisas todo antes de guardar."
                : "Se lee el texto del PDF. Revisas todo antes de guardar."}
            </span>
          </button>
          <label className="m-field">
            <span>O pega el texto de la rutina</span>
            <textarea
              className="m-input"
              value={text}
              onChange={(ev) => setText(ev.target.value)}
              placeholder={"Día 1 · Pierna\nSentadilla 4x6 RIR 2\n…"}
            />
          </label>
          <button
            type="button"
            className="m-btn m-press"
            data-block=""
            disabled={pending || text.trim().length < 3}
            onClick={analyze}
          >
            Analizar texto
          </button>
        </div>
      ) : (
        <div className="m-body m-stagger">
          <div className="m-file-chip">
            <span className="m-file-badge" aria-hidden="true">
              {file?.toLowerCase().endsWith(".pdf")
                ? "PDF"
                : file
                  ? "IMG"
                  : "TXT"}
            </span>
            <span className="m-list-row-main">
              <span className="m-list-row-title">{file ?? "Texto pegado"}</span>
              <span className="m-list-row-sub">
                {aiEnabled && file && preview?.readBy !== "texto"
                  ? "Leída por IA · "
                  : ""}
                {preview.dayCount} días · {preview.exerciseCount} ejercicios
              </span>
            </span>
            <Check
              size={20}
              strokeWidth={2.5}
              className="m-accent-text"
              aria-hidden="true"
            />
          </div>

          <label className="m-field">
            <span>Nombre</span>
            <input
              className="m-input"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              maxLength={80}
            />
          </label>

          {pendientes > 0 && (
            <div className="m-notice" data-tone="warn" role="status">
              {pendientes === 1
                ? "1 ejercicio necesita revisión: corrígelo con el lápiz, acepta una sugerencia o deslízalo para reemplazarlo o eliminarlo."
                : `${pendientes} ejercicios necesitan revisión: corrígelos con el lápiz, acepta una sugerencia o deslízalos para reemplazarlos o eliminarlos.`}
            </div>
          )}

          {days.map((day, d) => (
            <section key={d} className="m-stack" aria-label={day.name}>
              <div
                className="m-row"
                style={{ justifyContent: "space-between" }}
              >
                <h2 className="m-section">
                  {/* Si el nombre ya dice «Día 1», no se repite. */}
                  {/^d[ií]a\s*\d/i.test(day.name)
                    ? day.name
                    : `Día ${d + 1} · ${day.name}`}
                </h2>
                <span className="m-sub">
                  {day.exercises.filter((e) => !e.omit).length} ejercicios
                </span>
              </div>
              <ol className="m-editor-list">
                {day.exercises.map((e, i) =>
                  e.omit ? null : (
                    <SwipeRow
                      key={i}
                      className="m-editor-row m-import-row"
                      data-doubt={dudosa(e) ? "" : undefined}
                      deleteLabel={`Eliminar ${e.matchedName ?? e.rawName}`}
                      onDelete={() => remove(d, i)}
                      secondary={{
                        label: "Reemplazar",
                        icon: <ArrowLeftRight size={18} aria-hidden="true" />,
                        onClick: () => setReplacing([d, i]),
                      }}
                    >
                      <ImportRowView
                        row={e}
                        onAccept={(sug) => {
                          triggerHaptic("success");
                          edit(d, i, {
                            matchedId: sug.id,
                            matchedName: sug.name,
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="m-icon-btn m-press"
                        aria-label={`Editar ${e.matchedName ?? e.rawName}`}
                        onClick={() => setFixing([d, i])}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                    </SwipeRow>
                  ),
                )}
              </ol>
            </section>
          ))}
          <p className="m-sub" style={{ fontSize: 12, fontWeight: 500 }}>
            Desliza un ejercicio a la izquierda para reemplazarlo o eliminarlo;
            el lápiz ajusta series, reps y RIR.
          </p>
        </div>
      )}

      {preview && (
        <div className="m-step-foot">
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={
              pending ||
              pendientes > 0 ||
              !rows.some((e) => !e.omit && e.matchedId)
            }
            onClick={save}
          >
            {pending ? "Guardando…" : "Guardar rutina"}
          </button>
        </div>
      )}

      {fixRow && fixing && (
        <ExerciseValuesSheet
          open
          name={fixRow.matchedName ?? fixRow.rawName}
          description={
            fixRow.matchedId
              ? fixRow.matchedName !== fixRow.rawName
                ? `En tu PDF: «${fixRow.rawName}».`
                : "Gira cada rueda para ajustarlo."
              : `No reconocimos «${fixRow.rawName}»: búscalo en la biblioteca.`
          }
          values={fixRow}
          onChange={(v) => edit(fixing[0], fixing[1], v)}
          onClose={() => {
            // Lo que las ruedas mostraban es lo que se acepta con «Listo».
            const min = fixRow.repsMin ?? fixRow.repsMax ?? 10;
            edit(fixing[0], fixing[1], {
              sets: fixRow.sets ?? 3,
              repsMin: min,
              repsMax: fixRow.repsMax ?? min,
            });
            setFixing(null);
          }}
          onReplace={() => {
            setReplacing(fixing);
            setFixing(null);
          }}
        />
      )}

      <ReplaceScreen
        open={replacing !== null}
        onClose={() => setReplacing(null)}
        title={
          replaceRow?.matchedId ? "Reemplazar ejercicio" : "Buscar ejercicio"
        }
        source={
          replaceRow?.matchedId
            ? {
                id: replaceRow.matchedId,
                name: replaceRow.matchedName ?? replaceRow.rawName,
                primaryMuscle: "",
                secondaryMuscles: [],
                equipment: null,
              }
            : null
        }
        suggestions={replaceRow?.suggestions?.map((x) => ({
          ...x,
          primaryMuscle: "",
          secondaryMuscles: [],
          equipment: null,
        }))}
        onPick={(p) => {
          if (replacing)
            edit(replacing[0], replacing[1], {
              matchedId: p.id,
              matchedName: p.name,
            });
          triggerHaptic("success");
          setReplacing(null);
        }}
      />
    </div>
  );
}

/* Clases condicionales: el plugin de Tailwind de Prettier se come el
   espacio inicial dentro de una plantilla («m-num m-review-bad» quedaba
   «m-numm-review-bad»). */
const cx = (...c: (string | false)[]) => c.filter(Boolean).join(" ");

/** Lo leido de un ejercicio; en amarillo lo que falta o no se reconocio. */
function ImportRowView({
  row: e,
  onAccept,
}: {
  row: Row;
  onAccept: (s: { id: string; name: string }) => void;
}) {
  const falta = [!e.sets && "series", !e.repsMin && "reps"].filter(Boolean);
  return (
    <span className="m-editor-main">
      <span className={cx("m-list-row-title", !e.matchedId && "m-review-bad")}>
        {e.matchedName ?? e.rawName}
      </span>
      {e.matchedId && e.matchedName !== e.rawName && (
        <span className="m-list-row-sub">En tu PDF: «{e.rawName}»</span>
      )}
      <span className="m-list-row-sub">
        <span className={cx("m-num", incompleto(e) && "m-review-bad")}>
          {scheme(e)}
        </span>
      </span>
      {!e.matchedId &&
        (e.suggestions?.length ? (
          <span className="m-import-suggest">
            <span className="m-review-bad">¿Quisiste decir…?</span>
            {e.suggestions.map((sug) => (
              <button
                key={sug.id}
                type="button"
                className="m-chip m-press"
                onClick={() => onAccept(sug)}
              >
                {sug.name}
              </button>
            ))}
          </span>
        ) : (
          <span className="m-review-bad">
            No lo reconocimos. Desliza para buscarlo o elimínalo.
          </span>
        ))}
      {incompleto(e) && falta.length > 0 && (
        <span className="m-review-bad">
          Faltan {falta.join(" y ")}: ajústalo con el lápiz.
        </span>
      )}
    </span>
  );
}
