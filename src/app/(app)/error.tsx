"use client"; // Los limites de error deben ser componentes de cliente.

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

/**
 * Limite de error de todo el grupo (app).
 *
 * Envuelve page, loading y los layouts anidados, pero no al layout de este
 * mismo segmento: el shell (barra superior, navegacion) sigue en pie y solo
 * se sustituye el contenido. El usuario no pierde la navegacion por un fallo
 * de carga de una seccion.
 *
 * Next 16.2 expone unstable_retry, que vuelve a pedir los datos y re-renderiza
 * el segmento. Es lo que queremos aqui: reset() solo limpiaria el estado del
 * limite sin recuperar los datos que fallaron.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      onRetry={() => unstable_retry()}
      detail={error.digest}
      className="my-4"
    />
  );
}
