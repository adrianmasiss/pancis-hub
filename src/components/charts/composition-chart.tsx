"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { messages } from "@/i18n/es-419";
import type { DatedValue } from "@/lib/trends";

const t = messages.progress.composition;

type ChartPoint = {
  date: string;
  label: string;
  fatMass?: number;
  leanMass?: number;
};

function shortDate(date: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * Masa grasa contra masa magra en el tiempo. Separarlas es lo que hace
 * util un InBody: el peso solo no distingue perder grasa de perder
 * musculo. Con menos de dos mediciones no se dibuja nada, porque un punto
 * aislado no es una tendencia.
 */
export function CompositionChart({
  fatMass,
  leanMass,
}: {
  fatMass: DatedValue[];
  leanMass: DatedValue[];
}) {
  const byDate = new Map<string, ChartPoint>();

  for (const point of fatMass) {
    byDate.set(point.date, {
      date: point.date,
      label: shortDate(point.date),
      fatMass: point.value,
    });
  }
  for (const point of leanMass) {
    const existing = byDate.get(point.date);
    if (existing) existing.leanMass = point.value;
    else
      byDate.set(point.date, {
        date: point.date,
        label: shortDate(point.date),
        leanMass: point.value,
      });
  }

  const data = [...byDate.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (data.length < 2) return null;

  return (
    <figure aria-label={t.chartTitle}>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value: number) => value.toFixed(0)}
              width={54}
            />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              formatter={(value, name) => [`${String(value)} kg`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="plainline"
              formatter={(value: string) => (
                <span style={{ color: "var(--muted-foreground)" }}>{value}</span>
              )}
            />
            <Line
              name={t.leanMassLabel}
              dataKey="leanMass"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--chart-1)", strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              name={t.fatMassLabel}
              dataKey="fatMass"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--chart-2)", strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-muted-foreground mt-1 text-xs">
        {t.derivedNote}
      </figcaption>
    </figure>
  );
}
