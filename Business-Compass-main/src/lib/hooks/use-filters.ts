"use client";

import { useMemo } from "react";
import { useFilterContext } from "@/lib/store/filter-context";
import type { AnalysisResponse } from "@/lib/types";

/**
 * Hook that applies the current filter state to the analysis data.
 * Returns a filtered copy of the response for the active tab to render.
 */
export function useFilteredData(data: AnalysisResponse | null) {
  const { filters } = useFilterContext();

  return useMemo(() => {
    if (!data) return null;

    const { branches, selectedFYs, fySelectAll } = filters;
    const activeFYs = fySelectAll ? null : new Set(selectedFYs);
    const branchSet = new Set(branches);

    // Filter segments by branch
    const segments = data.segments.filter((s) => branchSet.has(s.name));

    // Filter FY data
    const revenueByFy = activeFYs
      ? data.revenueByFy.filter((r) => activeFYs.has(r.fy))
      : data.revenueByFy;

    // Filter weekly trend by branch + FY
    const weeklyTrend = data.weeklyTrend.filter(
      (w) =>
        branchSet.has(w.branch) && (!activeFYs || activeFYs.has(w.fy))
    );

    // Filter FY comparison by branch + FY
    const fyComparison = data.fyComparison.filter(
      (f) =>
        branchSet.has(f.branch) && (!activeFYs || activeFYs.has(f.fy))
    );

    // Filter monthly branch by branch
    const monthlyBranch = data.monthlyBranch.filter((m) =>
      branchSet.has(m.branch)
    );

    // Filter forecast by branch
    const forecast = data.forecast.filter((f) => branchSet.has(f.branch));

    // Expansion: only non-primary segments that are in branch filter
    const expansion = data.expansion.filter((e) => branchSet.has(e.segment));

    return {
      ...data,
      segments,
      revenueByFy,
      weeklyTrend,
      fyComparison,
      monthlyBranch,
      forecast,
      expansion,
    } satisfies AnalysisResponse;
  }, [data, filters]);
}
