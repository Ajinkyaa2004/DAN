"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
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

interface YearlyPurchaseBarProps {
  data: CustomerPurchase[];
}

export default function YearlyPurchaseBar({ data }: YearlyPurchaseBarProps) {
  const { pivoted, customers } = useMemo(() => {
    if (!data.length) return { pivoted: [], customers: [] as string[] };

    const customerSet = new Set<string>();
    const grouped = new Map<string, Record<string, unknown>>();

    for (const row of data) {
      customerSet.add(row.customer);
      const year = row.issueDate.slice(0, 4);
      if (!grouped.has(year)) {
        grouped.set(year, { year });
      }
      const entry = grouped.get(year)!;
      entry[row.customer] = ((entry[row.customer] as number) ?? 0) + row.total;
    }

    const sorted = Array.from(grouped.values()).sort((a, b) =>
      String(a.year).localeCompare(String(b.year))
    );

    return { pivoted: sorted, customers: Array.from(customerSet).sort() };
  }, [data]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={pivoted} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Legend />
        {customers.map((c, i) => (
          <Bar
            key={c}
            dataKey={c}
            fill={FY_COLORS[i % FY_COLORS.length]}
            name={c}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
