"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { isValidBarcode } from "@/features/foods/lib/barcode";
import { messages } from "@/i18n/es-419";

const t = messages.foods.barcode;

/**
 * Formatos de producto. Se piden explicitamente para que el detector no
 * pierda tiempo buscando QR y codigos que aqui no sirven.
 */
const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

/** La disponibilidad de camara no cambia durante la vida de la pagina. */
const subscribeNever = () => () => {};
const hasCamera = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getUserMedia === "function";

function getNativeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as Record<string, unknown>)
    .BarcodeDetector;
  return typeof candidate === "function"
    ? (candidate as BarcodeDetectorConstructor)
    : null;
}

/**
 * Detector para navegadores sin BarcodeDetector nativo, Safari y iPhone entre
 * ellos (defecto D-003). `barcode-detector` es un polyfill de esa misma API
 * sobre ZXing compilado a WebAssembly, asi que el resto no cambia: sea nativo
 * o polyfill, se usa igual.
 *
 * Se carga con import dinamico y solo cuando hace falta. En Chrome y Android,
 * que traen la API nativa, no se descarga nada.
 */
async function loadDetectorConstructor(): Promise<BarcodeDetectorConstructor | null> {
  const native = getNativeDetector();
  if (native) return native;
  if (typeof window === "undefined") return null;

  try {
    const { BarcodeDetector } = await import("barcode-detector/ponyfill");
    return BarcodeDetector as unknown as BarcodeDetectorConstructor;
  } catch {
    // Si el polyfill no carga (sin red, WebAssembly bloqueado), queda la
    // entrada manual, que nunca se esconde.
    return null;
  }
}

/**
 * La camara que lee codigos de barras, sin interfaz: la usan el escaner de
 * la despensa y la hoja de agregar alimento, cada uno con su propio marco.
 * Al leer un codigo valido apaga la camara y llama a `onCode`.
 */
export function useBarcodeCamera(onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const onCodeRef = useRef(onCode);
  const [error, setError] = useState<string | null>(null);
  /** El usuario nego el permiso (no es lo mismo que no tener camara). */
  const [denied, setDenied] = useState(false);
  /** La camara trasera tiene linterna controlable (Chrome en Android). */
  const [torchAvailable, setTorchAvailable] = useState(false);

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  /**
   * Con el polyfill, el unico requisito real es que el navegador tenga
   * camara. Se lee con useSyncExternalStore para que el servidor devuelva
   * false y no haya desajuste de hidratacion: alli no existe `navigator`.
   */
  const supportsCamera = useSyncExternalStore(
    subscribeNever,
    hasCamera,
    () => false,
  );

  /** Apaga la camara. Dejarla encendida al cerrar seria un fallo grave. */
  const stop = useCallback(() => {
    scanningRef.current = false;
    setTorchAvailable(false);
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setDenied(false);
    // El polyfill se descarga aqui, no al montar: solo paga el peso quien
    // realmente abre la camara en un navegador que lo necesita.
    const DetectorConstructor = await loadDetectorConstructor();
    if (!DetectorConstructor) {
      setError(t.noCameraSupport);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // La camara trasera es la util para escanear un envase.
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as
        (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      setTorchAvailable(Boolean(caps?.torch));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new DetectorConstructor({ formats: BARCODE_FORMATS });
      scanningRef.current = true;

      const scan = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const code = codes[0]?.rawValue;
          if (code && isValidBarcode(code)) {
            stop();
            onCodeRef.current(code);
            return;
          }
        } catch {
          // Un fotograma ilegible no es un error: se intenta con el siguiente.
        }
        setTimeout(scan, 300);
      };
      void scan();
    } catch (e) {
      setDenied(e instanceof DOMException && e.name === "NotAllowedError");
      setError(t.cameraDenied);
    }
  }, [stop]);

  /** Enciende o apaga la linterna; false si el navegador no lo permite. */
  const setTorch = useCallback(async (on: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return false;
    try {
      await track.applyConstraints({
        advanced: [{ torch: on } as MediaTrackConstraintSet],
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  // La camara se apaga tambien si el componente desaparece sin cerrar.
  useEffect(() => stop, [stop]);

  return {
    videoRef,
    supportsCamera,
    error,
    denied,
    torchAvailable,
    setTorch,
    start,
    stop,
  };
}
