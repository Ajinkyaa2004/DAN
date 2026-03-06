"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CustomerPurchase } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/formatters";

interface CustomerPurchaseBarProps {
  data: CustomerPurchase[];
  limit?: number;
}

export default function CustomerPurchaseBar({
  data,
  limit = 15,
}: CustomerPurchaseBarProps) {
  const aggregated = useMemo(() => {
    if (!data.length) return [];

    const totals = new Map<string, number>();
    for (const row of data) {
      totals.set(row.customer, (totals.get(row.customer) ?? 0) + row.total);
    }

    return Array.from(totals.entries())
      .map(([customer, total]) => ({ customer, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }, [data, limit]);

  if (!data.length) return null;

  const chartHeight = Math.max(300, aggregated.length * 32);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={aggregated} layout="vertical">
        <XAxis type="number" tickFormatter={(v: number) => formatCompact(v)} />
        <YAxis
          type="category"
          dataKey="customer"
          width={140}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Bar
          dataKey="total"
          fill="hsl(217, 91%, 50%)"
          radius={[0, 4, 4, 0]}
          name="Revenue"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
