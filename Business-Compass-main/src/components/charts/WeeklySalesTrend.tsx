"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyDataPoint } from "@/lib/types";
import { FY_COLORS } from "@/lib/constants";
import { formatCompact, formatCurrency } from "@/lib/formatters";

interface WeeklySalesTrendProps {
  data: WeeklyDataPoint[];
}

export default function WeeklySalesTrend({ data }: WeeklySalesTrendProps) {
  const { pivoted, fys } = useMemo(() => {
    if (!data.length) return { pivoted: [], fys: [] as string[] };

    const fySet = new Set<string>();
    const grouped = new Map<number, Record<string, unknown>>();

    for (const row of data) {
      fySet.add(row.fy);
      if (!grouped.has(row.fyWeek)) {
        grouped.set(row.fyWeek, { fyWeek: row.fyWeek });
      }
      const entry = grouped.get(row.fyWeek)!;
      entry[row.fy] = ((entry[row.fy] as number) ?? 0) + row.revenue;
    }

    const sorted = Array.from(grouped.values()).sort(
      (a, b) => (a.fyWeek as number) - (b.fyWeek as number)
    );

    return { pivoted: sorted, fys: Array.from(fySet) };
  }, [data]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fyWeek" label={{ value: "Week", position: "insideBottomRight", offset: -5 }} />
        <YAxis tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Legend />
        {fys.map((fy, i) => (
          <Line
            key={fy}
            type="monotone"
            dataKey={fy}
            stroke={FY_COLORS[i % FY_COLORS.length]}
            strokeWidth={2}
            dot={false}
            name={fy}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
