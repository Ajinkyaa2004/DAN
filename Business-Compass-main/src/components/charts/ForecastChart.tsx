"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ForecastPoint } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/formatters";

interface ForecastChartProps {
  data: ForecastPoint[];
  branch?: string;
}

export default function ForecastChart({ data, branch }: ForecastChartProps) {
  const pivoted = useMemo(() => {
    if (!data.length) return [];

    const targetBranch = branch ?? data[0].branch;
    const branchData = data.filter((d) => d.branch === targetBranch);

    const grouped = new Map<number, {
      fyWeek: number;
      actual: number | null;
      forecast: number | null;
      lowerBound: number | null;
      upperBound: number | null;
    }>();

    for (const row of branchData) {
      const existing = grouped.get(row.fyWeek);
      const entry = existing ?? {
        fyWeek: row.fyWeek,
        actual: null,
        forecast: null,
        lowerBound: null,
        upperBound: null,
      };

      if (row.isActual) {
        entry.actual = row.forecastTotal;
      } else {
        entry.forecast = row.forecastTotal;
        entry.lowerBound = row.lowerBound;
        entry.upperBound = row.upperBound;
      }

      grouped.set(row.fyWeek, entry);
    }

    return Array.from(grouped.values()).sort((a, b) => a.fyWeek - b.fyWeek);
  }, [data, branch]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fyWeek" />
        <YAxis tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Area
          type="monotone"
          dataKey="upperBound"
          stroke="none"
          fill="hsl(217, 91%, 80%)"
          fillOpacity={0.2}
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="lowerBound"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="hsl(217, 91%, 50%)"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
          name="Actual"
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="hsl(217, 91%, 50%)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls={false}
          name="Forecast"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
