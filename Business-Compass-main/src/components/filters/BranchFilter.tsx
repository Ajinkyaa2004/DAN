"use client";

import { useFilterContext } from "@/lib/store/filter-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// These are populated dynamically from uploaded data in production
const AVAILABLE_BRANCHES = ["Branch 1", "Branch 2", "Branch 3"]; // Placeholder

export function BranchFilter() {
  const { filters, setFilters } = useFilterContext();

  const toggle = (branch: string) => {
    const current = filters.branches;
    const next = current.includes(branch)
      ? current.filter((b) => b !== branch)
      : [...current, branch];
    setFilters({ branches: next });
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Branch
      </label>
      <div className="flex gap-2">
        {AVAILABLE_BRANCHES.map((branch) => (
          <Badge
            key={branch}
            variant={filters.branches.includes(branch) ? "default" : "outline"}
            className={cn(
              "cursor-pointer select-none transition-colors",
              filters.branches.includes(branch)
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-accent"
            )}
            onClick={() => toggle(branch)}
          >
            {branch}
          </Badge>
        ))}
      </div>
    </div>
  );
}
