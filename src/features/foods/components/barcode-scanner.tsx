"use client";

import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import { MacroChip } from "@/components/shared/macro-chip";
import {
  findByBarcodeAction,
  importExternalFood,
} from "@/features/foods/external-actions";
import type { ExternalSearchResult } from "@/features/foods/external-queries";
import {
  isValidBarcode,
  normalizeBarcode,
  toSearchableBarcode,
} from "@/features/foods/lib/barcode";
import { useBarcodeCamera } from "@/features/foods/lib/use-barcode-camera";
import { messages } from "@/i18n/es-419";

const t = messages.foods.barcode;
const n = messages.nutrition;

/**
 * Escaneo de codigo de barras para agregar productos empacados
 * (docs/02_PRODUCT_REQUIREMENTS.md 7.8).
 *
 * Usa BarcodeDetector, la API nativa del navegador, cuando existe. Safari y
 * iPhone no la traen, y ahi entra el polyfill de ZXing sobre WebAssembly, que
 * se descarga bajo demanda (defecto D-003).
 *
 * La entrada manual del codigo sigue SIEMPRE disponible, y no es redundante:
 * si el polyfill no carga por falta de red o por WebAssembly bloqueado, es lo
 * unico que queda.
 *
 * Por defecto importa el producto al catalogo. `onConfirm` permite reusar
 * el mismo escaner para otro destino (por ejemplo, la despensa) sin
 * duplicar la logica de camara ni de busqueda por codigo.
 */
export function BarcodeScanner({
  onConfirm,
  confirmLabel,
  successMessage,
}: {
  onConfirm?: (
    food: ExternalSearchResult,
  ) => Promise<{ error: string } | { success: true }>;
  confirmLabel?: string;
  successMessage?: string;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ExternalSearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const lookup = useCallback(async (rawCode: string) => {
    const code = normalizeBarcode(rawCode);
    if (!isValidBarcode(code)) {
      toast.error(t.invalidCode);
      return;
    }

    setSearching(true);
    setNotFound(false);
    const found = await findByBarcodeAction(toSearchableBarcode(code));
    setSearching(false);

    if (!found) {
      setNotFound(true);
      setResult(null);
      return;
    }
    setResult(found);
  }, []);

  const camera = useBarcodeCamera((code) => void lookup(code));
  const { stop: stopCamera, start: startCamera, videoRef } = camera;
  const supportsCamera = camera.supportsCamera;
  const cameraError = camera.error;

  const importFood = () => {
    if (!result) return;
    setImporting(true);
    void (async () => {
      if (onConfirm) {
        const res = await onConfirm(result);
        setImporting(false);
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success(successMessage ?? messages.foods.external.imported);
        setOpen(false);
        router.refresh();
        return;
      }

      const imported = await importExternalFood({
        source: result.source,
        externalId: result.externalId,
      });
      setImporting(false);
      if ("error" in imported) {
        toast.error(imported.error);
        return;
      }
      toast.success(
        imported.alreadyExisted
          ? messages.foods.external.alreadyInLibrary
          : messages.foods.external.imported,
      );
      setOpen(false);
      router.refresh();
    })();
  };

  const reset = () => {
    setResult(null);
    setNotFound(false);
    setManualCode("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          reset();
          void startCamera();
        } else {
          stopCamera();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Barcode className="size-4" aria-hidden="true" />
          {t.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {supportsCamera && !result ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                className="bg-muted aspect-video w-full rounded-lg object-cover"
                muted
                playsInline
                aria-label={t.cameraLabel}
              />
              {cameraError ? (
                <p className="text-destructive text-xs">{cameraError}</p>
              ) : (
                <p className="text-muted-foreground text-xs">{t.aiming}</p>
              )}
            </div>
          ) : null}

          {!supportsCamera ? (
            <p className="text-muted-foreground text-xs">{t.noCameraSupport}</p>
          ) : null}

          {!result ? (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void lookup(manualCode);
              }}
            >
              <Label htmlFor="barcode-manual">{t.manualLabel}</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode-manual"
                  inputMode="numeric"
                  autoComplete="off"
                  value={manualCode}
                  placeholder="7501000111145"
                  onChange={(event) => setManualCode(event.target.value)}
                />
                <Button
                  type="submit"
                  disabled={searching || !manualCode.trim()}
                >
                  {searching ? <NewtonsCradle size={24} /> : null}
                  {t.search}
                </Button>
              </div>
            </form>
          ) : null}

          {notFound ? (
            <p className="text-muted-foreground text-sm">{t.notFound}</p>
          ) : null}

          {result ? (
            <div className="space-y-3 rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <FoodThumbnail
                  src={result.imageUrl}
                  alt={result.name}
                  className="size-12"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="truncate font-medium">{result.name}</span>
                    {result.brand ? (
                      <span className="text-muted-foreground">
                        · {result.brand}
                      </span>
                    ) : null}
                    <Badge variant="outline" className="font-normal">
                      Open Food Facts
                    </Badge>
                  </p>
                  <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 text-xs">
                    <MacroChip
                      type="calories"
                      value={result.per100g.calories}
                    />
                    <MacroChip type="protein" value={result.per100g.proteinG} />
                    <MacroChip
                      type="carbs"
                      value={result.per100g.carbohydrateG}
                    />
                    <MacroChip type="fat" value={result.per100g.fatG} />
                    <span>{n.per100g}</span>
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">
                {messages.foods.external.unverifiedNotice}
              </p>

              <div className="flex gap-2">
                {result.alreadyImported && !onConfirm ? (
                  <p className="text-muted-foreground flex-1 text-sm">
                    {messages.foods.external.alreadyInLibrary}
                  </p>
                ) : (
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={importing}
                    onClick={importFood}
                  >
                    {importing ? (
                      <NewtonsCradle size={24} />
                    ) : (
                      <Plus className="size-4" aria-hidden="true" />
                    )}
                    {confirmLabel ?? messages.foods.external.importButton}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    void startCamera();
                  }}
                >
                  {t.scanAnother}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
