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

type WeightTrendChartProps = {
  daily: DatedValue[];
  average: DatedValue[];
};

type ChartPoint = {
  date: string;
  label: string;
  daily?: number;
  average?: number;
};

function shortDate(date: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

const t = messages.dashboard.progress;

export function WeightTrendChart({ daily, average }: WeightTrendChartProps) {
  const byDate = new Map<string, ChartPoint>();
  for (const point of daily) {
    byDate.set(point.date, {
      date: point.date,
      label: shortDate(point.date),
      daily: point.value,
    });
  }
  for (const point of average) {
    const existing = byDate.get(point.date);
    if (existing) existing.average = point.value;
    else
      byDate.set(point.date, {
        date: point.date,
        label: shortDate(point.date),
        average: point.value,
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
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
              tickFormatter={(value: number) => value.toFixed(1)}
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
                <span style={{ color: "var(--muted-foreground)" }}>
                  {value}
                </span>
              )}
            />
            <Line
              name={t.chartDaily}
              dataKey="daily"
              stroke="var(--chart-1)"
              strokeOpacity={0.45}
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--chart-1)", strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              name={t.chartAverage}
              dataKey="average"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-muted-foreground mt-1 text-xs">
        {t.trendNote}
      </figcaption>
    </figure>
  );
}
