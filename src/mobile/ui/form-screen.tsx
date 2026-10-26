"use client";

import type { FormEventHandler, ReactNode } from "react";
import { BackButton } from "@/mobile/ui/back-button";

/**
 * Formulario de la vista movil a pantalla completa: «volver» y titulo arriba,
 * campos grandes en medio y la accion principal fija abajo, sobre el area
 * segura. Es el reemplazo de los formularios de escritorio que se abrian tal
 * cual en el telefono (alta de alimentos, editar perfil, medidas…).
 */
export function FormScreen({
  title,
  back,
  backLabel = "Volver",
  onSubmit,
  footer,
  children,
}: {
  title: string;
  /** A donde vuelve si la pantalla se abrio directo. */
  back: string;
  backLabel?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  /** La barra fija de abajo (normalmente el boton principal). */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const inner = (
    <>
      <header className="m-step-head">
        <BackButton fallback={back} label={backLabel} />
        <h1 className="m-form-title">{title}</h1>
      </header>
      <div className="m-body m-stagger">{children}</div>
      {footer && <div className="m-step-foot">{footer}</div>}
    </>
  );
  return onSubmit ? (
    <form
      className="m-screen m-form"
      data-m-fullscreen=""
      onSubmit={onSubmit}
      noValidate
    >
      {inner}
    </form>
  ) : (
    <div className="m-screen m-form" data-m-fullscreen="">
      {inner}
    </div>
  );
}

/** Rotulo arriba, campo grande, y la ayuda o el error debajo. */
export function FormField({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="m-field" data-invalid={error ? "" : undefined}>
      <span>
        {label}
        {optional && <small className="m-field-optional"> · opcional</small>}
      </span>
      {children}
      {error ? (
        <small role="alert" className="m-field-error">
          {error}
        </small>
      ) : hint ? (
        <small className="m-field-hint">{hint}</small>
      ) : null}
    </label>
  );
}

/** Grupo de campos con su rotulo, como las tarjetas de Perfil. */
export function FormSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="m-form-section">
      {title && <h2 className="m-eyebrow">{title}</h2>}
      <div className="m-form-card">{children}</div>
    </section>
  );
}
