"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilterContext } from "@/lib/store/filter-context";
import { BranchFilter } from "@/components/filters/BranchFilter";
import { FYFilter } from "@/components/filters/FYFilter";
import { CustomerFilter } from "@/components/filters/CustomerFilter";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { YearRangeSlider } from "@/components/filters/YearRangeSlider";

interface FilterBarProps {
  customers: string[];
}

export function FilterBar({ customers }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { resetFilters } = useFilterContext();

  return (
    <div className="border border-border rounded-lg bg-card mb-6">
      {/* Toggle header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-lg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Filters</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Filter content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-border pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <BranchFilter />
            <FYFilter />
            <CustomerFilter customers={customers} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DateRangeFilter />
            <YearRangeSlider />
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
