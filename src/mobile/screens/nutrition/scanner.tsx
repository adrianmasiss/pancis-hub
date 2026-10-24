"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Flashlight, Keyboard, PenLine, X } from "lucide-react";
import { toast } from "sonner";
import {
  findByBarcodeAction,
  importExternalFood,
} from "@/features/foods/external-actions";
import {
  isValidBarcode,
  normalizeBarcode,
  toSearchableBarcode,
} from "@/features/foods/lib/barcode";
import { useBarcodeCamera } from "@/features/foods/lib/use-barcode-camera";
import { triggerHaptic } from "@/lib/haptics";
import { messages } from "@/i18n/es-419";
import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { Sheet } from "@/mobile/ui/sheet";
import { goBack } from "@/mobile/ui/back-button";

const t = messages.foods.barcode;

type Estado =
  | "permiso" // antes de pedir la camara: se explica para que es
  | "camara"
  | "buscando"
  | "no-encontrado";

/**
 * Escaner de codigo de barras a pantalla completa (vista movil). La camara y
 * la busqueda son las de escritorio (`useBarcodeCamera`,
 * `findByBarcodeAction`); cambia el marco: video de fondo, recuadro con
 * esquinas en acento y linea de escaneo.
 *
 * Al leer un codigo se importa el producto (si hacia falta) y se abre su
 * ficha movil. Si no existe, se ofrece crearlo.
 */
export function BarcodeScannerScreen({ backHref }: { backHref: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("permiso");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [torch, setTorchOn] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);

  const lookup = useCallback(
    async (raw: string) => {
      const code = normalizeBarcode(raw);
      if (!isValidBarcode(code)) {
        toast.error(t.invalidCode);
        return;
      }
      triggerHaptic("success");
      setCodigo(code);
      setEstado("buscando");
      const found = await findByBarcodeAction(toSearchableBarcode(code));
      if (!found) {
        setEstado("no-encontrado");
        return;
      }
      let foodId = found.importedFoodId;
      if (!foodId) {
        const imported = await importExternalFood({
          source: found.source,
          externalId: found.externalId,
        });
        if ("error" in imported) {
          toast.error(imported.error);
          setEstado("no-encontrado");
          return;
        }
        foodId = imported.foodId;
      }
      router.replace(`/nutricion?vista=biblioteca&alimento=${foodId}`);
    },
    [router],
  );

  const {
    videoRef,
    supportsCamera,
    error,
    denied,
    torchAvailable,
    setTorch,
    start,
    stop,
  } = useBarcodeCamera((code) => void lookup(code));

  // Si el permiso ya estaba dado, no hace falta la pantalla previa.
  useEffect(() => {
    let cancel = false;
    void navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((p) => {
        if (!cancel && p.state === "granted") {
          setEstado("camara");
          void start();
        }
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [start]);

  const encender = () => {
    setEstado("camara");
    void start();
  };

  const otraVez = () => {
    setCodigo(null);
    setEstado("camara");
    void start();
  };

  const cerrar = () => {
    stop();
    goBack(router, backHref);
  };

  const conCamara = estado === "camara" && supportsCamera;

  return (
    <div className="m-scan" data-m-fullscreen="">
      <video
        ref={videoRef}
        className="m-scan-video"
        muted
        playsInline
        aria-label={t.cameraLabel}
        hidden={!conCamara || Boolean(error)}
      />

      <div className="m-scan-top">
        <button
          type="button"
          className="m-icon-btn m-press"
          data-glass=""
          aria-label="Cerrar escáner"
          onClick={cerrar}
        >
          <X size={20} aria-hidden="true" />
        </button>
        {conCamara && torchAvailable && (
          <button
            type="button"
            className="m-icon-btn m-press"
            data-glass=""
            aria-pressed={torch}
            aria-label={torch ? "Apagar linterna" : "Encender linterna"}
            onClick={async () => {
              if (await setTorch(!torch)) setTorchOn(!torch);
            }}
          >
            <Flashlight
              size={20}
              aria-hidden="true"
              className={torch ? "m-accent-text" : undefined}
            />
          </button>
        )}
      </div>

      {estado === "permiso" && (
        <div className="m-scan-center">
          <span className="m-scan-icon" aria-hidden="true">
            <Camera size={28} />
          </span>
          <h1 className="m-card-title" data-size="lg">
            Escanea el código del envase
          </h1>
          <p className="m-sheet-text">
            Usamos la cámara sólo mientras esta pantalla está abierta, para leer
            el código de barras. No guardamos imágenes.
          </p>
          {supportsCamera ? (
            <button
              type="button"
              className="m-btn m-press"
              data-variant="primary"
              data-block=""
              onClick={encender}
            >
              Activar cámara
            </button>
          ) : (
            <p className="m-sheet-text">{t.noCameraSupport}</p>
          )}
        </div>
      )}

      {estado === "camara" && error && (
        <div className="m-scan-center">
          <span className="m-scan-icon" data-tone="warn" aria-hidden="true">
            <Camera size={28} />
          </span>
          <h1 className="m-card-title" data-size="lg">
            {denied ? "Sin permiso de cámara" : "No pudimos abrir la cámara"}
          </h1>
          <p className="m-sheet-text">
            {denied
              ? "Para escanear, permite la cámara en los ajustes del navegador (en iPhone: Ajustes › Safari › Cámara). Mientras tanto puedes escribir el código."
              : error}
          </p>
          <button
            type="button"
            className="m-btn m-press"
            data-block=""
            onClick={otraVez}
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {conCamara && !error && (
        <>
          <div className="m-scan-frame" aria-hidden="true">
            <span className="m-scan-line" />
          </div>
          <p className="m-scan-help" role="status">
            {t.aiming}
          </p>
        </>
      )}

      {estado === "buscando" && (
        <div className="m-scan-center" role="status">
          <NewtonsCradle size={40} />
          <p className="m-sheet-text">
            Buscando el código <span className="m-num">{codigo}</span>…
          </p>
        </div>
      )}

      {estado === "no-encontrado" && (
        <div className="m-scan-center">
          <h1 className="m-card-title" data-size="lg">
            No encontramos ese producto
          </h1>
          <p className="m-sheet-text">
            El código <span className="m-num">{codigo}</span> no está en Open
            Food Facts. Puedes crearlo con los datos de su etiqueta.
          </p>
          <Link
            href="/nutricion/alimentos"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
          >
            <Camera size={16} aria-hidden="true" />
            Crear con foto de la etiqueta
          </Link>
          <Link
            href="/nutricion/alimentos"
            className="m-btn m-press"
            data-block=""
          >
            <PenLine size={16} aria-hidden="true" />
            Crear a mano
          </Link>
          <button
            type="button"
            className="m-btn m-press"
            data-variant="ghost"
            data-block=""
            onClick={otraVez}
          >
            {t.scanAnother}
          </button>
        </div>
      )}

      {(estado === "permiso" || estado === "camara") && (
        <div className="m-scan-foot">
          <button
            type="button"
            className="m-btn m-press"
            data-block=""
            onClick={() => setManualOpen(true)}
          >
            <Keyboard size={16} aria-hidden="true" />
            Escribir código
          </button>
        </div>
      )}

      <Sheet
        open={manualOpen}
        onOpenChange={setManualOpen}
        title="Escribir código"
        description="Los números bajo las barras del envase."
      >
        <form
          className="m-stack"
          onSubmit={(e) => {
            e.preventDefault();
            setManualOpen(false);
            stop();
            void lookup(manual);
          }}
        >
          <label className="m-field">
            <span className="sr-only">{t.manualLabel}</span>
            <input
              className="m-input m-num"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9 ]*"
              placeholder="7 501234 567890"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              autoFocus
            />
          </label>
          <button
            type="submit"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            disabled={manual.replace(/\D/g, "").length < 6}
          >
            {t.search}
          </button>
        </form>
      </Sheet>
    </div>
  );
}
