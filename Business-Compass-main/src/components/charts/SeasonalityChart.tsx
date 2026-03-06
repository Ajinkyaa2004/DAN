"use client";

import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SeasonalityPeriod } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/formatters";

interface SeasonalityChartProps {
  data: SeasonalityPeriod[];
  chartType?: "line" | "bar";
}

const PRIMARY_COLOR = "hsl(217, 91%, 50%)";

export default function SeasonalityChart({
  data,
  chartType = "line",
}: SeasonalityChartProps) {
  if (!data.length) return null;

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={288}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} />
          <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
          <Bar dataKey="revenue" fill={PRIMARY_COLOR} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={PRIMARY_COLOR}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
