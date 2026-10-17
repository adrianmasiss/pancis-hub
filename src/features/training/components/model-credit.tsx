import { Info } from "lucide-react";
import "./model-credit.css";

/**
 * El crédito del maniquí 3D, plegado en un botón sobre el propio modelo.
 *
 * La licencia (CC BY 4.0) pide nombrar al autor, enlazar la licencia y decir
 * si la obra se modificó, «de cualquier forma razonable según el medio». En
 * una app basta con que esté junto a la obra y a un toque, no impreso bajo
 * cada lista. `<details>` nativo: se abre con teclado y sin código propio.
 */
export function ModelCredit({ className }: { className?: string }) {
  return (
    <details className={`model-credit ${className ?? ""}`}>
      <summary aria-label="Acerca del modelo 3D">
        <Info size={15} strokeWidth={2} aria-hidden="true" />
      </summary>
      <div className="model-credit-panel">
        <p>
          Modelo «Muscle body» de{" "}
          <a
            href="https://sketchfab.com/DB3D2534"
            target="_blank"
            rel="noreferrer"
          >
            DB3D2534
          </a>
          , bajo licencia{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.es"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          . Adaptado para Pancis Hub: geometría simplificada y materiales
          propios.
        </p>
        <p>
          Las zonas encendidas son una guía visual aproximada, no una
          segmentación anatómica exacta.
        </p>
      </div>
    </details>
  );
}
