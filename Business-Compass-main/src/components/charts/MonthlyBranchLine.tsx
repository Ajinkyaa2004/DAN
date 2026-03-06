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
import type { MonthlyBranchPoint } from "@/lib/types";
import { getBranchColor } from "@/lib/constants";
import { formatCompact, formatCurrency } from "@/lib/formatters";

interface MonthlyBranchLineProps {
  data: MonthlyBranchPoint[];
}

export default function MonthlyBranchLine({ data }: MonthlyBranchLineProps) {
  const { pivoted, branches } = useMemo(() => {
    if (!data.length) return { pivoted: [], branches: [] as string[] };

    const branchSet = new Set<string>();
    const grouped = new Map<string, Record<string, unknown>>();
    const monthOrder: string[] = [];

    for (const row of data) {
      branchSet.add(row.branch);
      if (!grouped.has(row.month)) {
        grouped.set(row.month, { month: row.month });
        monthOrder.push(row.month);
      }
      const entry = grouped.get(row.month)!;
      entry[row.branch] = ((entry[row.branch] as number) ?? 0) + row.revenue;
    }

    const pivotedData = monthOrder.map((m) => grouped.get(m)!);
    return { pivoted: pivotedData, branches: Array.from(branchSet) };
  }, [data]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip formatter={(value: number | undefined) => formatCurrency(value)} />
        <Legend />
        {branches.map((branch) => (
          <Line
            key={branch}
            type="monotone"
            dataKey={branch}
            stroke={getBranchColor(branch)}
            strokeWidth={2}
            dot={false}
            name={branch}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
