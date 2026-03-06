"use client";

import { useMemo, useState } from "react";
import { useFilterContext } from "@/lib/store/filter-context";
import type { AnalysisResponse } from "@/lib/types";
import FYComparisonBar from "@/components/charts/FYComparisonBar";
import MonthlyBranchLine from "@/components/charts/MonthlyBranchLine";
import WeeklySalesTrend from "@/components/charts/WeeklySalesTrend";
import YearlyPurchaseBar from "@/components/charts/YearlyPurchaseBar";
import MonthlyPurchaseTrend from "@/components/charts/MonthlyPurchaseTrend";
import { QuarterWeekFilter } from "@/components/filters/QuarterWeekFilter";
import { AnalyticsFilterPanel } from "@/components/filters/AnalyticsFilterPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const QUARTER_WEEK_RANGES: Record<string, [number, number]> = {
  Q1: [1, 13],
  Q2: [14, 26],
  Q3: [27, 39],
  Q4: [40, 52],
};

interface SalesTrendsProps {
  data: AnalysisResponse;
}

export function SalesTrends({ data }: SalesTrendsProps) {
  const { filters } = useFilterContext();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [purchaseDateStart, setPurchaseDateStart] = useState(data.meta.dataRange.start);
  const [purchaseDateEnd, setPurchaseDateEnd] = useState(data.meta.dataRange.end);

  if (!data) return <EmptyState title="No data" message="Run analysis first." />;

  // Unique customers for multiselect
  const allCustomers = useMemo(() => {
    const customerMap = new Map<string, string>();
    data.customerPurchases.forEach((p) => {
      if (!customerMap.has(p.customer)) {
        customerMap.set(p.customer, p.customerName || p.customer);
      }
    });
    return Array.from(customerMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.customerPurchases]);

  // Weekly trend — branch + FY + quarter/week filters
  const filteredWeekly = useMemo(() => {
    return data.weeklyTrend.filter((pt) => {
      if (!filters.branches.includes(pt.branch)) return false;
      if (!filters.fySelectAll && !filters.selectedFYs.includes(pt.fy)) return false;
      if (filters.selectedWeeks.length > 0) return filters.selectedWeeks.includes(pt.fyWeek);
      if (filters.quarters.includes("All Quarters")) return true;
      return filters.quarters.some((q) => {
        const range = QUARTER_WEEK_RANGES[q];
        return range && pt.fyWeek >= range[0] && pt.fyWeek <= range[1];
      });
    });
  }, [data.weeklyTrend, filters]);

  const totalSalesForRange = useMemo(
    () => filteredWeekly.reduce((sum, pt) => sum + pt.revenue, 0),
    [filteredWeekly]
  );

  // FY comparison — branch + FY filters
  const filteredFYComparison = useMemo(() => {
    return data.fyComparison.filter((pt) => {
      if (!filters.branches.includes(pt.branch)) return false;
      if (!filters.fySelectAll && !filters.selectedFYs.includes(pt.fy)) return false;
      return true;
    });
  }, [data.fyComparison, filters.branches, filters.fySelectAll, filters.selectedFYs]);

  // Monthly — branch filter only
  const filteredMonthly = useMemo(
    () => data.monthlyBranch.filter((pt) => filters.branches.includes(pt.branch)),
    [data.monthlyBranch, filters.branches]
  );

  // Customer purchases — customer + date filters
  const filteredPurchases = useMemo(() => {
    return data.customerPurchases.filter((p) => {
      if (selectedCustomers.length > 0 && !selectedCustomers.includes(p.customer)) return false;
      if (p.issueDate < purchaseDateStart || p.issueDate > purchaseDateEnd) return false;
      return true;
    });
  }, [data.customerPurchases, selectedCustomers, purchaseDateStart, purchaseDateEnd]);

  const totalPurchaseFiltered = useMemo(
    () => filteredPurchases.reduce((sum, p) => sum + p.total, 0),
    [filteredPurchases]
  );

  const toggleCustomer = (customer: string) =>
    setSelectedCustomers((prev) =>
      prev.includes(customer) ? prev.filter((c) => c !== customer) : [...prev, customer]
    );

  return (
    <div className="space-y-6">
      {/* Global filter panel — Branch + FY */}
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <AnalyticsFilterPanel data={data} />
      </div>

      {/* Section 1 — FY Comparison (grouped bars) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Financial Year Sales by Branch
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total revenue per FY broken down by branch. Toggle FYs above to compare specific years.
          </p>
        </CardHeader>
        <CardContent>
          {filteredFYComparison.length > 0 ? (
            <FYComparisonBar data={filteredFYComparison} />
          ) : (
            <EmptyState title="No FY data" message="No branch / FY matches active filters." />
          )}
        </CardContent>
      </Card>

      {/* Section 2 — Monthly Branch Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Sales by Branch</CardTitle>
          <p className="text-sm text-muted-foreground">
            Month-by-month revenue per branch.
          </p>
        </CardHeader>
        <CardContent>
          {filteredMonthly.length > 0 ? (
            <MonthlyBranchLine data={filteredMonthly} />
          ) : (
            <EmptyState title="No monthly data" message="No branch matches active filters." />
          )}
        </CardContent>
      </Card>

      {/* Section 3 — Weekly Trend + metric + detailed table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Week-by-Week Sales Trend</CardTitle>
          <p className="text-sm text-muted-foreground">
            FY-over-FY weekly comparison — drill into quarters using the selector below.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <QuarterWeekFilter />
          </div>

          {/* Total Sales metric */}
          <div className="rounded-md bg-muted/20 border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Sales for Selected Range
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totalSalesForRange)}</p>
          </div>

          {filteredWeekly.length > 0 ? (
            <WeeklySalesTrend data={filteredWeekly} />
          ) : (
            <EmptyState
              title="No weekly data"
              message="No data matches the selected quarter / week range."
            />
          )}

          {/* Detailed Sales Table */}
          {filteredWeekly.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Detailed Sales for Selected Range</p>
              <div className="rounded-md border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium">Branch</th>
                      <th className="text-left px-3 py-2 font-medium">FY</th>
                      <th className="text-right px-3 py-2 font-medium">Week</th>
                      <th className="text-right px-3 py-2 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredWeekly]
                      .sort(
                        (a, b) =>
                          a.fy.localeCompare(b.fy) ||
                          a.branch.localeCompare(b.branch) ||
                          a.fyWeek - b.fyWeek
                      )
                      .map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-border last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-3 py-2">{row.branch}</td>
                          <td className="px-3 py-2">{row.fy}</td>
                          <td className="px-3 py-2 text-right">{row.fyWeek}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatCurrency(row.revenue)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td colSpan={3} className="px-3 py-2 font-semibold">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-semibold font-mono">
                        {formatCurrency(totalSalesForRange)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Customer Purchase Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Customer-wise Purchase Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Yearly and monthly purchase breakdown — filter by customer and date range.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Customer(s){" "}
                <span className="normal-case font-normal">
                  — {selectedCustomers.length === 0 ? "All" : selectedCustomers.map(id => allCustomers.find(c => c.id === id)?.name || id).join(", ")}
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allCustomers.map((c) => (
                  <Badge
                    key={c.id}
                    variant={selectedCustomers.includes(c.id) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer select-none text-xs transition-colors",
                      selectedCustomers.includes(c.id)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent"
                    )}
                    onClick={() => toggleCustomer(c.id)}
                  >
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={purchaseDateStart}
                  onChange={(e) => setPurchaseDateStart(e.target.value)}
                  className="text-sm border border-border rounded px-2 py-1 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={purchaseDateEnd}
                  onChange={(e) => setPurchaseDateEnd(e.target.value)}
                  className="text-sm border border-border rounded px-2 py-1 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Total Purchase metric */}
          <div className="rounded-md bg-muted/20 border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Purchase for Filtered Records
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totalPurchaseFiltered)}</p>
            <p className="text-xs text-muted-foreground">
              {filteredPurchases.length} invoice
              {filteredPurchases.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filteredPurchases.length > 0 ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-2">Yearly Purchase Summary</p>
                <YearlyPurchaseBar data={filteredPurchases} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Monthly Purchase Trend</p>
                <MonthlyPurchaseTrend data={filteredPurchases} />
              </div>
            </div>
          ) : (
            <EmptyState
              title="No purchase data"
              message="No invoices match the selected filters."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
