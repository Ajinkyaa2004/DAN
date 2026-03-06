"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { FilterState } from "@/lib/types";

const initialFilters: FilterState = {
  branches: [], // Populated from uploaded data
  fySelectAll: true,
  selectedFYs: ["FY24/25"], // Default, updated from data
  customers: [],
  yearRange: [2018, 2026],
  dateRange: { start: "2018-09-05", end: "2026-02-26" },
  quarters: ["All Quarters"],
  selectedWeeks: [],
};

interface FilterContextValue {
  filters: FilterState;
  setFilters: (update: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilterState] = useState<FilterState>(initialFilters);

  const setFilters = useCallback((update: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...update }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState(initialFilters);
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return ctx;
}
