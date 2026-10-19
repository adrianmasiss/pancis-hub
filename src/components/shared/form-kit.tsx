"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, FileCheck2, FileUp, X } from "lucide-react";
import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { cn } from "@/lib/utils";
import "./form-kit.css";

/**
 * Piezas de formulario con el acabado de la ficha de alimento: cifras con su
 * unidad dentro del campo, grupos con rotulo pequeno (plegables si son
 * opcionales) y un selector de archivo propio en lugar del nativo, que sale
 * en ingles y con el aspecto del sistema.
 */

/** Campo numerico compacto: rotulo arriba y la unidad dentro, a la derecha. */
export function MetricField({
  label,
  unit,
  lead,
  className,
  type = "number",
  ...inputProps
}: {
  label: string;
  unit?: string;
  /** El dato principal del formulario: un poco mas grande. */
  lead?: boolean;
} & React.ComponentProps<"input">) {
  const id = useId();
  return (
    <div
      className={cn("pc-metric", className)}
      data-lead={lead ? "" : undefined}
    >
      <label htmlFor={id}>{label}</label>
      <div className="pc-metric-box">
        <input
          id={id}
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          placeholder="—"
          {...inputProps}
        />
        {unit ? <span aria-hidden="true">{unit}</span> : null}
      </div>
    </div>
  );
}

/**
 * Grupo de campos en un panel hundido. Con `collapsible` se pliega: lo
 * opcional no ocupa sitio hasta que se pide, y `filled` cuenta cuantos campos
 * traen valor para que se sepa que hay algo dentro sin abrirlo.
 */
export function FormGroup({
  title,
  hint,
  collapsible = false,
  defaultOpen = true,
  filled,
  children,
  className,
}: {
  title: string;
  hint?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  filled?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen || !collapsible);
  // Si el formulario pasa a necesitarlo (p. ej. elegir InBody), se abre solo;
  // nunca se cierra por su cuenta con lo que ya se escribio dentro.
  const [wanted, setWanted] = useState(defaultOpen);
  if (defaultOpen !== wanted) {
    setWanted(defaultOpen);
    if (defaultOpen) setOpen(true);
  }
  const panelId = useId();

  if (!collapsible) {
    return (
      <section className={cn("pc-group", className)}>
        <header className="pc-group-head">
          <h3 className="label-micro">{title}</h3>
          {hint ? <p>{hint}</p> : null}
        </header>
        {children}
      </section>
    );
  }

  return (
    <section
      className={cn("pc-group", className)}
      data-collapsible=""
      data-open={open ? "" : undefined}
    >
      <button
        type="button"
        className="pc-group-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <strong>{title}</strong>
          {hint ? <small>{hint}</small> : null}
        </span>
        {filled ? <em>{filled}</em> : null}
        <ChevronDown aria-hidden="true" size={16} />
      </button>
      {/* Plegado pero montado: los valores siguen yendo en el FormData. */}
      <div className="pc-group-panel" id={panelId} inert={!open}>
        <div>
          <div className="pc-group-body">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Selector de archivo propio: muestra el nombre elegido y deja quitarlo. */
export function FileField({
  name,
  accept,
  label,
  help,
  onFile,
}: {
  name?: string;
  accept?: string;
  label: string;
  help?: string;
  /** Para validar al elegir; si rechaza y vacia el input, no se muestra. */
  onFile?: (
    file: File | null,
    event: React.ChangeEvent<HTMLInputElement> | null,
  ) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);

  return (
    <div className="pc-file" data-filled={file ? "" : undefined}>
      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          onFile?.(event.target.files?.[0] ?? null, event);
          setFile(event.target.files?.[0]?.name ?? null);
        }}
      />
      <label htmlFor={id}>
        <span className="pc-file-icon" aria-hidden="true">
          <FileUp size={17} />
        </span>
        <span className="pc-file-text">
          <strong>{file ?? label}</strong>
          {help ? <small>{file ? label : help}</small> : null}
        </span>
      </label>
      {file ? (
        <button
          type="button"
          className="pc-file-clear"
          aria-label="Quitar el archivo"
          onClick={() => {
            if (input.current) input.current.value = "";
            setFile(null);
            onFile?.(null, null);
          }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Eleccion entre pocas opciones como pildoras, con un input oculto para que
 * el valor viaje en el FormData como si fuera un select.
 */
export function ChoicePills<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
}: {
  /** Sin nombre no viaja en el FormData: el valor vive en el estado. */
  name?: string;
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="pc-choice">
      <legend>{label}</legend>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;

/**
 * Zona de subida grande, para cuando el archivo ES la entrada principal
 * (importar una rutina o una dieta). Acepta clic y arrastrar. Con `file`
 * muestra el elegido y permite quitarlo; con `busy`, el pendulo de la casa.
 */
export function DropZone({
  accept,
  title,
  hint,
  busy = false,
  busyLabel,
  file,
  onFile,
  onClear,
}: {
  accept: string;
  title: string;
  hint: string;
  busy?: boolean;
  busyLabel?: string;
  file?: File | null;
  onFile: (file: File, input: HTMLInputElement | null) => void;
  onClear?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div className="pc-drop-wrap">
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) onFile(picked, event.target);
          if (!onClear) event.target.value = "";
        }}
      />
      <button
        type="button"
        className="pc-drop"
        data-over={over || undefined}
        data-filled={file ? "" : undefined}
        disabled={busy}
        aria-busy={busy || undefined}
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped && !busy) onFile(dropped, null);
        }}
      >
        <span className="pc-drop-icon" aria-hidden="true">
          {busy ? (
            <NewtonsCradle size={26} />
          ) : file ? (
            <FileCheck2 size={20} />
          ) : (
            <FileUp size={20} />
          )}
        </span>
        <strong>{busy ? (busyLabel ?? title) : (file?.name ?? title)}</strong>
        <small>
          {file && !busy
            ? `${formatSize(file.size)} · Toca para cambiarlo`
            : hint}
        </small>
      </button>
      {file && onClear && !busy ? (
        <button
          type="button"
          className="pc-file-clear pc-drop-clear"
          aria-label="Quitar el archivo"
          onClick={() => {
            if (input.current) input.current.value = "";
            onClear();
          }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
