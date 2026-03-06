"use client";

import { useFilterContext } from "@/lib/store/filter-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalysisResponse } from "@/lib/types";
import { useEffect } from "react";

interface AnalyticsFilterPanelProps {
  data: AnalysisResponse;
}

export function AnalyticsFilterPanel({ data }: AnalyticsFilterPanelProps) {
  const { filters, setFilters } = useFilterContext();
  
  // Get actual branches and FYs from the data
  const availableBranches = data.segments.map(s => s.name);
  const availableFYs = data.revenueByFy.map(r => r.fy);
  
  // Initialize filters with actual branch names on mount
  useEffect(() => {
    if (filters.branches.length === 0 && availableBranches.length > 0) {
      setFilters({ branches: [...availableBranches], selectedFYs: [...availableFYs] });
    }
  }, [availableBranches, availableFYs, filters.branches.length, setFilters]);

  const toggleBranch = (branch: string) => {
    const next = filters.branches.includes(branch)
      ? filters.branches.filter((b) => b !== branch)
      : [...filters.branches, branch];
    if (next.length > 0) setFilters({ branches: next });
  };

  const toggleFYAll = () => {
    if (filters.fySelectAll) {
      setFilters({ fySelectAll: false, selectedFYs: [availableFYs[availableFYs.length - 2] || "FY24/25"] });
    } else {
      setFilters({ fySelectAll: true, selectedFYs: [...availableFYs] });
    }
  };

  const toggleFY = (fy: string) => {
    const next = filters.selectedFYs.includes(fy)
      ? filters.selectedFYs.filter((f) => f !== fy)
      : [...filters.selectedFYs, fy];
    const nextFYs = next.length > 0 ? next : [fy];
    setFilters({
      selectedFYs: nextFYs,
      fySelectAll: nextFYs.length === availableFYs.length,
    });
  };

  return (
    <div className="space-y-3">
      {/* Branch */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Branch
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableBranches.map((branch) => (
            <Badge
              key={branch}
              variant={filters.branches.includes(branch) ? "default" : "outline"}
              className={cn(
                "cursor-pointer select-none text-xs transition-colors",
                filters.branches.includes(branch)
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-accent"
              )}
              onClick={() => toggleBranch(branch)}
            >
              {branch}
            </Badge>
          ))}
        </div>
      </div>

      {/* Financial Year */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Financial Year
        </label>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={filters.fySelectAll ? "default" : "outline"}
            className={cn(
              "cursor-pointer select-none text-xs transition-colors",
              filters.fySelectAll
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-accent"
            )}
            onClick={toggleFYAll}
          >
            All FYs
          </Badge>
          {!filters.fySelectAll &&
            availableFYs.map((fy) => (
              <Badge
                key={fy}
                variant={filters.selectedFYs.includes(fy) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer select-none text-xs transition-colors",
                  filters.selectedFYs.includes(fy)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent"
                )}
                onClick={() => toggleFY(fy)}
              >
                {fy}
              </Badge>
            ))}
        </div>
      </div>
    </div>
  );
}
