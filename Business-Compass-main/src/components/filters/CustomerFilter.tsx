"use client";

import { useState } from "react";
import { useFilterContext } from "@/lib/store/filter-context";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CustomerFilterProps {
  customers: string[];
}

export function CustomerFilter({ customers }: CustomerFilterProps) {
  const { filters, setFilters } = useFilterContext();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.toLowerCase().includes(search.toLowerCase()) &&
      !filters.customers.includes(c)
  );

  const addCustomer = (customer: string) => {
    setFilters({ customers: [...filters.customers, customer] });
    setSearch("");
    setIsOpen(false);
  };

  const removeCustomer = (customer: string) => {
    setFilters({
      customers: filters.customers.filter((c) => c !== customer),
    });
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Customer
      </label>

      {filters.customers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {filters.customers.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1">
              {c}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeCustomer(c)}
              />
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          placeholder={
            filters.customers.length
              ? "Add another customer\u2026"
              : "All customers (type to filter)"
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="h-8 text-sm"
        />
        {isOpen && search && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
            {filtered.slice(0, 20).map((c) => (
              <button
                key={c}
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addCustomer(c);
                }}
              >
                {c}
              </button>
            ))}
            {filtered.length > 20 && (
              <p className="px-3 py-1.5 text-xs text-muted-foreground">
                +{filtered.length - 20} more\u2026
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
