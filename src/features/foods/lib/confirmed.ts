/**
 * Cuándo un alimento lleva el check de verificado (nov 2026).
 *
 * El check promete que los números son reales y correctos, así que sólo lo
 * lleva lo que se sostiene sin dudas con lo que sabemos de cada fila:
 *
 * - Viene de USDA y es un genérico (sin código de barras): análisis de
 *   laboratorio. Los productos de marca de USDA, aunque la base los publique,
 *   son la etiqueta que declara el fabricante, y Open Food Facts es lo que
 *   alguien subió desde el empaque.
 * - Sus números se sostienen (`data_issue` vacío).
 * - Si otra fuente describe el mismo alimento, no discrepa más del umbral.
 * - El usuario no lo corrigió: lo que ve ya no es lo que midió el laboratorio.
 * - No es un alimento propio: lo escribió o escaneó el usuario.
 */

import { DIVERGENCE_THRESHOLD } from "./source-agreement";

export type ConfirmableFood = {
  externalSource: string | null;
  barcode: string | null;
  dataIssue: string | null | undefined;
  maxDivergencePct: number | null;
  isCorrected: boolean;
  isOwn: boolean;
};

export function isConfirmedFood(food: ConfirmableFood): boolean {
  return (
    food.externalSource === "usda" &&
    !food.barcode &&
    !food.dataIssue &&
    (food.maxDivergencePct === null ||
      food.maxDivergencePct <= DIVERGENCE_THRESHOLD) &&
    !food.isCorrected &&
    !food.isOwn
  );
}
