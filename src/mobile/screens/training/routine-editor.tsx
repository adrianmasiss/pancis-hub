"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "motion/react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronLeft,
  GripVertical,
  Dumbbell,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { savePlanEdits } from "@/features/training/plan-edit-actions";
import type { PlanDetail } from "@/features/training/queries";
import { triggerHaptic } from "@/lib/haptics";
import { goBack } from "@/mobile/ui/back-button";
import { Sheet } from "@/mobile/ui/sheet";
import { SwipeRow } from "@/mobile/ui/swipe-row";
import {
  ExerciseValuesSheet,
  ReplaceScreen,
  musclesOf,
  scheme,
  type CatalogPick,
  type ExerciseValues,
} from "./routine-edit-kit";
import { dayTitle } from "./week-data";

type Row = CatalogPick &
  ExerciseValues & {
    /** Clave estable en pantalla (la fila guardada o una nueva). */
    key: string;
    /** La fila de `workout_plan_exercises`; nueva, sin id. */
    rowId?: string;
  };

type Day = { id: string; title: string; rows: Row[] };

const BACK = "/entrenamiento?vista=rutinas";

function fromPlan(plan: PlanDetail): Day[] {
  return plan.days.map((d) => ({
    id: d.id,
    title: dayTitle(d),
    rows: d.exercises.map((e) => ({
      key: e.id,
      rowId: e.id,
      id: e.exerciseId,
      name: e.name,
      primaryMuscle: e.primaryMuscle,
      secondaryMuscles: e.secondaryMuscles,
      equipment: e.equipment,
      sets: e.sets,
      repsMin: e.repsMin,
      repsMax: e.repsMax,
      rir: e.rir,
      restSeconds: e.restSeconds,
    })),
  }));
}

/** Lo que cambio frente a lo guardado, para la confirmacion. */
function changesOf(before: Day[], after: Day[]) {
  let added = 0;
  let removed = 0;
  let replaced = 0;
  let edited = 0;
  let moved = 0;
  for (const [i, day] of after.entries()) {
    const old = before[i]!.rows;
    const oldById = new Map(old.map((r) => [r.rowId, r]));
    const keep = new Set(day.rows.map((r) => r.rowId));
    removed += old.filter((r) => !keep.has(r.rowId)).length;
    const ordenViejo = old.filter((r) => keep.has(r.rowId)).map((r) => r.key);
    const ordenNuevo = day.rows.filter((r) => r.rowId).map((r) => r.key);
    if (ordenViejo.join() !== ordenNuevo.join()) moved++;
    for (const r of day.rows) {
      const o = r.rowId ? oldById.get(r.rowId) : undefined;
      if (!o) added++;
      else if (o.id !== r.id) replaced++;
      else if (scheme(o) !== scheme(r)) edited++;
    }
  }
  const partes = [
    replaced &&
      `${replaced} ${replaced === 1 ? "reemplazado" : "reemplazados"}`,
    added && `${added} ${added === 1 ? "agregado" : "agregados"}`,
    removed && `${removed} ${removed === 1 ? "eliminado" : "eliminados"}`,
    edited && `${edited} con series o reps nuevas`,
    moved && "orden cambiado",
  ].filter(Boolean) as string[];
  return partes;
}

/**
 * El estado de una edicion de rutina: los dias con sus ejercicios, lo que
 * cambio y lo que se abre encima (valores, reemplazo, confirmar). Todo es
 * local hasta «Guardar», que confirma (y avisa si es la rutina del coach).
 * Lo de antes queda en Versiones. Lo usan la pantalla completa y la edicion
 * en linea de Entrenar · Hoy.
 */
export function usePlanEditor(
  plan: PlanDetail,
  {
    onSaved,
    images = {},
  }: { onSaved: () => void; images?: Record<string, string> },
) {
  const [initial] = useState(() => fromPlan(plan));
  const [days, setDays] = useState(initial);
  const [editing, setEditing] = useState<{ day: number; key: string } | null>(
    null,
  );
  const [replacing, setReplacing] = useState<{
    day: number;
    key: string | null;
  } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [saving, startSaving] = useTransition();

  const cambios = changesOf(initial, days);
  const dirty = cambios.length > 0;
  const coach = plan.origin === "coach";

  const setRows = (day: number, fn: (rows: Row[]) => Row[]) =>
    setDays((ds) =>
      ds.map((d, i) => (i === day ? { ...d, rows: fn(d.rows) } : d)),
    );
  const rowOf = (day: number, key: string | null) =>
    days[day]?.rows.find((r) => r.key === key) ?? null;

  const remove = (day: number, row: Row) => {
    const at = days[day]!.rows.indexOf(row);
    setRows(day, (rows) => rows.filter((r) => r.key !== row.key));
    toast(`${row.name} quitado`, {
      action: {
        label: "Deshacer",
        onClick: () =>
          setRows(day, (rows) => [
            ...rows.slice(0, at),
            row,
            ...rows.slice(at),
          ]),
      },
    });
  };

  const pick = (p: CatalogPick) => {
    if (!replacing) return;
    const { day, key } = replacing;
    if (key) {
      setRows(day, (rows) =>
        rows.map((r) => (r.key === key ? { ...r, ...p, key: r.key } : r)),
      );
    } else {
      setRows(day, (rows) => [
        ...rows,
        {
          ...p,
          key: `nuevo-${Date.now()}`,
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          rir: 2,
          restSeconds: 90,
        },
      ]);
    }
    triggerHaptic("success");
    setReplacing(null);
  };

  const save = () =>
    startSaving(async () => {
      const result = await savePlanEdits({
        planId: plan.id,
        days: days.map((d) => ({
          dayId: d.id,
          exercises: d.rows.map((r) => ({
            id: r.rowId,
            exerciseId: r.id,
            sets: r.sets,
            repsMin: r.repsMin,
            repsMax: r.repsMax,
            rir: r.rir,
            restSeconds: r.restSeconds,
          })),
        })),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success("Rutina guardada. La anterior queda en Versiones.");
      setConfirm(false);
      onSaved();
    });

  const editRow = editing ? rowOf(editing.day, editing.key) : null;
  const replaceRow = replacing ? rowOf(replacing.day, replacing.key) : null;

  /** Los dias con sus filas: asa, foto, Cambiar/Editar y deslizar. */
  const lists = days.map((day, d) => (
    <section
      key={day.id}
      className="m-stack"
      aria-labelledby={`m-ed-${day.id}`}
    >
      <h2 id={`m-ed-${day.id}`} className="m-section">
        Día {d + 1} · {day.title}
      </h2>
      <Reorder.Group
        as="ol"
        axis="y"
        values={day.rows}
        onReorder={(rows) => setRows(d, () => rows)}
        className="m-editor-list"
      >
        {day.rows.map((row) => (
          <EditorRow
            key={row.key}
            row={row}
            image={images[row.id]}
            onEdit={() => setEditing({ day: d, key: row.key })}
            onReplace={() => setReplacing({ day: d, key: row.key })}
            onDelete={() => remove(d, row)}
          />
        ))}
      </Reorder.Group>
      <button
        type="button"
        className="m-set-add m-press"
        onClick={() => setReplacing({ day: d, key: null })}
      >
        <Plus size={16} aria-hidden="true" />
        Agregar ejercicio
      </button>
    </section>
  ));

  const overlays = (
    <>
      {editRow && editing && (
        <ExerciseValuesSheet
          open
          onClose={() => setEditing(null)}
          name={editRow.name}
          values={editRow}
          onChange={(v) =>
            setRows(editing.day, (rows) =>
              rows.map((r) => (r.key === editRow.key ? { ...r, ...v } : r)),
            )
          }
        />
      )}

      <ReplaceScreen
        open={replacing !== null}
        onClose={() => setReplacing(null)}
        source={replaceRow}
        title={replaceRow ? "Cambiar ejercicio" : "Agregar ejercicio"}
        onPick={pick}
      />

      <Sheet
        open={confirm}
        onOpenChange={(o) => !o && setConfirm(false)}
        title="¿Guardar los cambios?"
        description={
          <>
            {cambios.join(" · ")}.{" "}
            {coach
              ? "Vas a modificar la rutina importada de tu coach; la original queda en Versiones."
              : "La versión anterior queda en Versiones."}
          </>
        }
        icon={
          coach ? (
            <span className="m-sheet-icon" data-tone="warn" aria-hidden="true">
              <AlertTriangle size={24} />
            </span>
          ) : undefined
        }
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={saving}
          onClick={save}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          className="m-btn"
          data-variant="ghost"
          data-block=""
          onClick={() => setConfirm(false)}
        >
          Seguir editando
        </button>
      </Sheet>
    </>
  );

  return {
    cambios,
    dirty,
    coach,
    saving,
    askSave: () => setConfirm(true),
    lists,
    overlays,
  };
}

/** Lo que se pierde al salir sin guardar: guardar, descartar o seguir. */
export function DiscardSheet({
  open,
  cambios,
  onClose,
  onSave,
  onDiscard,
}: {
  open: boolean;
  cambios: string[];
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Tienes cambios sin guardar"
      description={`${cambios.join(" · ")}.`}
    >
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        onClick={() => {
          onClose();
          onSave();
        }}
      >
        Guardar
      </button>
      <button
        type="button"
        className="m-btn m-press"
        data-variant="danger"
        data-block=""
        onClick={() => {
          onClose();
          onDiscard();
        }}
      >
        Descartar cambios
      </button>
      <button
        type="button"
        className="m-btn"
        data-variant="ghost"
        data-block=""
        onClick={onClose}
      >
        Seguir editando
      </button>
    </Sheet>
  );
}

/**
 * Editar rutina en el telefono, a pantalla completa (desde Rutinas): los
 * dias con sus ejercicios en lista. Cada uno se cambia, se edita con ruedas,
 * se reordena desde el asa y se borra deslizando.
 */
export function RoutineEditorMobile({
  plan,
  images,
}: {
  plan: PlanDetail;
  images?: Record<string, string>;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const ed = usePlanEditor(plan, {
    images,
    onSaved: () => {
      goBack(router, BACK);
      router.refresh();
    },
  });

  return (
    <div className="m-screen m-editor" data-m-fullscreen="">
      <header className="m-step-head">
        <button
          type="button"
          className="m-icon-btn m-press"
          aria-label="Volver a Rutinas"
          onClick={() => (ed.dirty ? setLeaving(true) : goBack(router, BACK))}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="m-list-row-main">
          <span style={{ fontSize: 17, fontWeight: 800 }}>Editar rutina</span>
          <span className="m-list-row-sub">{plan.name}</span>
        </div>
      </header>

      <div className="m-body">
        {ed.coach && (
          <p className="m-notice" data-tone="warn">
            <AlertTriangle size={16} aria-hidden="true" />
            Es la rutina de tu coach: lo que cambies modifica la rutina
            importada. La original queda en Versiones.
          </p>
        )}
        {ed.lists}
        <p className="m-sub" style={{ fontSize: 12, fontWeight: 500 }}>
          Arrastra desde el asa para reordenar; desliza a la izquierda para
          quitar.
        </p>
      </div>

      <div className="m-editor-foot">
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={!ed.dirty || ed.saving}
          onClick={ed.askSave}
        >
          {ed.dirty ? "Guardar cambios" : "Sin cambios"}
        </button>
      </div>

      {ed.overlays}
      <DiscardSheet
        open={leaving}
        cambios={ed.cambios}
        onClose={() => setLeaving(false)}
        onSave={ed.askSave}
        onDiscard={() => goBack(router, BACK)}
      />
    </div>
  );
}

function EditorRow({
  row,
  image,
  onEdit,
  onReplace,
  onDelete,
}: {
  row: Row;
  image?: string;
  onEdit: () => void;
  onReplace: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  const m = musclesOf(row);
  return (
    <SwipeRow
      className="m-editor-row"
      deleteLabel={`Quitar ${row.name}`}
      onDelete={onDelete}
      reorder={{ value: row, controls }}
    >
      <span className="m-editor-handle" data-drag-handle="" aria-hidden="true">
        <GripVertical size={18} />
      </span>
      <ExerciseAvatar image={image} />
      <span className="m-editor-main">
        <span className="m-list-row-title">{row.name}</span>
        <span className="m-list-row-sub">
          <span className="m-num">{scheme(row)}</span>
          {m.primary ? ` · ${m.primary}` : ""}
        </span>
        <span className="m-editor-actions">
          <button
            type="button"
            className="m-btn m-press"
            data-size="sm"
            onClick={onReplace}
          >
            <ArrowLeftRight size={14} aria-hidden="true" />
            Cambiar
          </button>
          <button
            type="button"
            className="m-btn m-press"
            data-size="sm"
            onClick={onEdit}
          >
            <Pencil size={14} aria-hidden="true" />
            Editar
          </button>
        </span>
      </span>
    </SwipeRow>
  );
}

/** La foto del ejercicio en circulo, como la de perfil; sin foto, la pesa. */
export function ExerciseAvatar({ image }: { image?: string }) {
  return (
    <span className="m-ex-avatar" aria-hidden="true">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto del catalogo
        <img src={image} alt="" loading="lazy" />
      ) : (
        <Dumbbell size={16} strokeWidth={2} />
      )}
    </span>
  );
}
