"use client";

import { useFilterContext } from "@/lib/store/filter-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Default FY list - in production, this would come from actual data
const AVAILABLE_FYS = ["FY18/19", "FY19/20", "FY20/21", "FY21/22", "FY22/23", "FY23/24", "FY24/25"];

export function FYFilter() {
  const { filters, setFilters } = useFilterContext();

  const toggleSelectAll = () => {
    if (filters.fySelectAll) {
      setFilters({ fySelectAll: false, selectedFYs: [AVAILABLE_FYS[0]] });
    } else {
      setFilters({ fySelectAll: true, selectedFYs: [...AVAILABLE_FYS] });
    }
  };

  const toggleFY = (fy: string) => {
    const current = filters.selectedFYs;
    const next = current.includes(fy)
      ? current.filter((f) => f !== fy)
      : [...current, fy];
    setFilters({ selectedFYs: next, fySelectAll: false });
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Financial Year
      </label>
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          id="fy-select-all"
          checked={filters.fySelectAll}
          onCheckedChange={toggleSelectAll}
        />
        <label htmlFor="fy-select-all" className="text-sm cursor-pointer">
          Select All
        </label>
      </div>
      {!filters.fySelectAll && (
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_FYS.map((fy) => (
            <Badge
              key={fy}
              variant={
                filters.selectedFYs.includes(fy) ? "default" : "outline"
              }
              className={cn(
                "cursor-pointer select-none text-xs transition-colors",
                filters.selectedFYs.includes(fy)
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-accent"
              )}
              onClick={() => toggleFY(fy)}
            >
              {fy.replace("FY", "")}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
