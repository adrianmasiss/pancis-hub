"use client";
import { useState } from "react";
import { V11Card, V11CardHead } from "./v11-card";
type Region = { name: string; value: string };
export function BodyRegions({
  title = "Cuerpo por regiones",
  regions,
}: {
  title?: string;
  regions: Region[];
}) {
  const [back, setBack] = useState(false);
  return (
    <V11Card className="v11-padded body-regions">
      <V11CardHead
        title={title}
        aside={
          <div
            className="body-view-toggle"
            role="group"
            aria-label="Vista del cuerpo"
          >
            <button
              type="button"
              aria-pressed={!back}
              onClick={() => setBack(false)}
            >
              Frontal
            </button>
            <button
              type="button"
              aria-pressed={back}
              onClick={() => setBack(true)}
            >
              Posterior
            </button>
          </div>
        }
      />
      <div className="body-regions-content">
        <div className="anatomy-image">
          {/* Supplied artwork, not a computed recovery map. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={back ? "/anatomy/back.png" : "/anatomy/front.png"}
            alt={`Referencia anatómica, vista ${back ? "posterior" : "frontal"}`}
            width={520}
            height={1414}
          />
        </div>
        <div>
          <dl className="region-list">
            {regions.map((r) => (
              <div key={r.name}>
                <dt>{r.name}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          {!regions.length && (
            <p className="text-muted-foreground text-sm">
              Los datos por región aparecerán cuando los registres.
            </p>
          )}
          <p className="text-muted-foreground mt-5 text-xs">
            Ilustración de referencia.
          </p>
        </div>
      </div>
    </V11Card>
  );
}
