/**
 * La descarga del maniqui 3D, aparte del componente para que se pueda
 * empezar sin traer `three`: Entrenar la pide al entrar y, cuando el
 * maniqui se monta, el archivo ya esta (o esta llegando).
 */

/** El maniqui comprimido con Meshopt (5,5 MB -> 1,3 MB). */
export const MODEL_URL = "/anatomy/muscle-body.glb?v=meshopt";

/** Una sola descarga por pagina, compartida por todos los maniquies. */
let modelo: Promise<ArrayBuffer> | null = null;

export function downloadMuscleModel(): Promise<ArrayBuffer> {
  modelo ??= fetch(MODEL_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`modelo ${r.status}`);
      return r.arrayBuffer();
    })
    .catch((e: unknown) => {
      modelo = null;
      throw e;
    });
  return modelo;
}

/** Empieza a bajar el modelo y el codigo del visor en segundo plano. */
export function preloadMuscleModel() {
  void downloadMuscleModel().catch(() => {});
  void import("@/features/training/components/muscle-model").catch(() => {});
}
