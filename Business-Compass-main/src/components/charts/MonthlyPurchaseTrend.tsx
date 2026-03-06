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
import type { CustomerPurchase } from "@/lib/types";
import { FY_COLORS } from "@/lib/constants";
import { formatCompact, formatCurrency } from "@/lib/formatters";

interface MonthlyPurchaseTrendProps {
  data: CustomerPurchase[];
}

export default function MonthlyPurchaseTrend({ data }: MonthlyPurchaseTrendProps) {
  const { pivoted, customers } = useMemo(() => {
    if (!data.length) return { pivoted: [], customers: [] as string[] };

    const customerSet = new Set<string>();
    const grouped = new Map<string, Record<string, unknown>>();
    const monthOrder: string[] = [];

    for (const row of data) {
      customerSet.add(row.customer);
      const month = row.issueDate.slice(0, 7);
      if (!grouped.has(month)) {
        grouped.set(month, { month });
        monthOrder.push(month);
      }
      const entry = grouped.get(month)!;
      entry[row.customer] = ((entry[row.customer] as number) ?? 0) + row.total;
    }

    const sorted = [...monthOrder].sort().map((m) => grouped.get(m)!);

    return { pivoted: sorted, customers: Array.from(customerSet).sort() };
  }, [data]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={pivoted} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Legend />
        {customers.map((c, i) => (
          <Line
            key={c}
            type="monotone"
            dataKey={c}
            stroke={FY_COLORS[i % FY_COLORS.length]}
            strokeWidth={2}
            dot={false}
            name={c}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
