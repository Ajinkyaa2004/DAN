"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CustomerTrend } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/formatters";

interface CustomerPurchaseLineProps {
  data: CustomerTrend[];
  type: "dropping" | "rising";
}

export default function CustomerPurchaseLine({
  data,
  type,
}: CustomerPurchaseLineProps) {
  if (!data.length) return null;

  const chartHeight = Math.max(300, data.length * 40);
  const currentColor = type === "rising" ? "hsl(217, 91%, 50%)" : "hsl(0, 72%, 51%)";

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tickFormatter={(v: number) => formatCompact(v)} />
        <YAxis
          type="category"
          dataKey="customer"
          width={140}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Legend />
        <Bar
          dataKey="priorYearRevenue"
          fill="hsl(0, 0%, 70%)"
          name="Prior Year"
        />
        <Bar
          dataKey="currentYearRevenue"
          fill={currentColor}
          name="Current Year"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
