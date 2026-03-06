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
import type { FYBranchTotal } from "@/lib/types";
import { getBranchColor } from "@/lib/constants";

interface FYComparisonBarProps {
  data: FYBranchTotal[];
}

// Recharts 3.x has a domain-scaling bug with very large numbers (100M+).
// Values are stored as $M (e.g. 112 = $112M) so recharts works correctly.
const toM = (v: number) => v / 1_000_000;
const fmtAxisM = (v: number) => `$${v.toFixed(0)}M`;
const fmtTooltipM = (value: unknown) => {
  const n = Number(value);
  return isNaN(n) ? "—" : `$${n.toFixed(1)}M`;
};

export default function FYComparisonBar({ data }: FYComparisonBarProps) {
  const { pivoted, branches, domainMax } = useMemo(() => {
    if (!data.length) return { pivoted: [], branches: [] as string[], domainMax: 100 };

    const branchSet = new Set<string>();
    const grouped = new Map<string, Record<string, unknown>>();
    let rawMax = 0;

    for (const row of data) {
      branchSet.add(row.branch);
      if (!grouped.has(row.fy)) {
        grouped.set(row.fy, { fy: row.fy });
      }
      const entry = grouped.get(row.fy)!;
      // Store as $M to avoid recharts 3.x large-number bar-height bug
      const newVal = ((entry[row.branch] as number) ?? 0) + toM(row.total);
      entry[row.branch] = newVal;
      if (newVal > rawMax) rawMax = newVal;
    }

    // Round up with 15% headroom to a clean number — fed as explicit domain
    // so recharts 3.x bypasses its auto-computation bug (domainFromUserPreference path)
    const domainMax = Math.ceil((rawMax * 1.15) / 10) * 10;

    // Sort FYs chronologically
    const allFYs = ["FY18/19","FY19/20","FY20/21","FY21/22","FY22/23","FY23/24","FY24/25","FY25/26"];
    const sorted = allFYs.filter((fy) => grouped.has(fy)).map((fy) => grouped.get(fy)!);

    return {
      pivoted: sorted,
      branches: Array.from(branchSet),
      domainMax,
    };
  }, [data]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={pivoted} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fy" />
        <YAxis
          allowDataOverflow
          domain={[0, domainMax]}
          tickFormatter={fmtAxisM}
        />
        <Tooltip formatter={fmtTooltipM} />
        <Legend />
        {branches.map((branch) => (
          <Bar
            key={branch}
            dataKey={branch}
            fill={getBranchColor(branch)}
            name={branch}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
