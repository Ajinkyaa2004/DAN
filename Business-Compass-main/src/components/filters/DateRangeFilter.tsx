"use client";

import { useFilterContext } from "@/lib/store/filter-context";
import { Input } from "@/components/ui/input";

export function DateRangeFilter() {
  const { filters, setFilters } = useFilterContext();

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Issue Date Range
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.dateRange.start}
          onChange={(e) =>
            setFilters({
              dateRange: { ...filters.dateRange, start: e.target.value },
            })
          }
          className="h-8 text-sm"
        />
        <span className="text-xs text-muted-foreground">\u2013</span>
        <Input
          type="date"
          value={filters.dateRange.end}
          onChange={(e) =>
            setFilters({
              dateRange: { ...filters.dateRange, end: e.target.value },
            })
          }
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
