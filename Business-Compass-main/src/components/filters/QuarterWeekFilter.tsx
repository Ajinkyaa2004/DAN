"use client";

import { useFilterContext } from "@/lib/store/filter-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const QUARTERS = [
  { id: "All Quarters", label: "All" },
  { id: "Q1", label: "Q1 (W1\u201313)" },
  { id: "Q2", label: "Q2 (W14\u201326)" },
  { id: "Q3", label: "Q3 (W27\u201339)" },
  { id: "Q4", label: "Q4 (W40\u201352)" },
];

export function QuarterWeekFilter() {
  const { filters, setFilters } = useFilterContext();

  const toggleQuarter = (q: string) => {
    if (q === "All Quarters") {
      setFilters({ quarters: ["All Quarters"], selectedWeeks: [] });
      return;
    }

    const current = filters.quarters.filter((x) => x !== "All Quarters");
    const next = current.includes(q)
      ? current.filter((x) => x !== q)
      : [...current, q];

    setFilters({
      quarters: next.length === 0 ? ["All Quarters"] : next,
      selectedWeeks: [],
    });
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Quarter
      </label>
      <div className="flex flex-wrap gap-1.5">
        {QUARTERS.map((q) => (
          <Badge
            key={q.id}
            variant={
              filters.quarters.includes(q.id) ? "default" : "outline"
            }
            className={cn(
              "cursor-pointer select-none text-xs transition-colors",
              filters.quarters.includes(q.id)
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-accent"
            )}
            onClick={() => toggleQuarter(q.id)}
          >
            {q.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
