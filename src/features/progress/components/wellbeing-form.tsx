"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { Label } from "@/components/ui/label";
import { saveWellbeing } from "@/features/progress/wellbeing-actions";
import type { WellbeingEntry } from "@/features/progress/queries";
import { todayLocalISO } from "@/lib/dates";
import { messages } from "@/i18n/es-419";
import { toOptionalNumber } from "@/lib/forms";

const t = messages.wellbeing;

type ScaleKey = "sleepQuality" | "energy" | "stress" | "soreness" | "mood";

const SCALES: { key: ScaleKey; label: string }[] = [
  { key: "sleepQuality", label: t.sleepQuality },
  { key: "energy", label: t.energy },
  { key: "stress", label: t.stress },
  { key: "soreness", label: t.soreness },
  { key: "mood", label: t.mood },
];

/**
 * Registro diario de bienestar. Vive en progreso, junto a las mediciones:
 * el sueno y el estres son parte de como se lee el progreso, no una
 * seccion aparte.
 */
export function WellbeingForm({ today }: { today: WellbeingEntry | null }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    sleepHours: today?.sleepHours ?? undefined,
    sleepQuality: today?.sleepQuality ?? undefined,
    energy: today?.energy ?? undefined,
    stress: today?.stress ?? undefined,
    soreness: today?.soreness ?? undefined,
    mood: today?.mood ?? undefined,
    notes: today?.notes ?? "",
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveWellbeing({
        // Fecha local, no UTC: cerca de medianoche UTC daria "manana".
        date: todayLocalISO(),
        ...form,
        notes: form.notes || undefined,
      });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.saved);
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.title}</CardTitle>
        <p className="text-muted-foreground text-xs">{t.description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {today ? (
            <p className="text-muted-foreground text-xs">{t.todayRegistered}</p>
          ) : null}

          <FormField
            label={t.sleepHours}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            max="24"
            value={form.sleepHours ?? ""}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                sleepHours: toOptionalNumber(event.target.value),
              }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            {SCALES.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`wellbeing-${key}`}>{label}</Label>
                <select
                  id={`wellbeing-${key}`}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={form[key] ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      [key]: toOptionalNumber(event.target.value),
                    }))
                  }
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">{t.scaleHint}</p>

          <FormField
            label={t.notes}
            value={form.notes}
            maxLength={300}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                notes: event.target.value,
              }))
            }
          />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? messages.common.loading : t.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
