"use client";

import { useFilterContext } from "@/lib/store/filter-context";
import { Slider } from "@/components/ui/slider";

export function YearRangeSlider() {
  const { filters, setFilters } = useFilterContext();

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Year Range
      </label>
      <div className="px-1">
        <Slider
          min={2018}
          max={2026}
          step={1}
          value={filters.yearRange}
          onValueChange={(value) =>
            setFilters({ yearRange: value as [number, number] })
          }
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {filters.yearRange[0]}
          </span>
          <span className="text-xs text-muted-foreground">
            {filters.yearRange[1]}
          </span>
        </div>
      </div>
    </div>
  );
}
