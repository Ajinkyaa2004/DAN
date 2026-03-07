"use client";

import type { AnalysisResponse } from "@/lib/types";
import { formatCurrency, formatPercentPlain } from "@/lib/formatters";
import { CASH_THRESHOLDS } from "@/lib/constants";
import { DecisionCard } from "@/components/shared/DecisionCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { DataGapBanner } from "@/components/shared/DataGapBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BP3CashOutstanding({ data }: { data: AnalysisResponse }) {
  const { cash, topCustomersByOutstanding, decisions } = data;

  if (!cash) {
    return <EmptyState title="No cash data" message="Upload invoice data to see outstanding balances." />;
  }

  // Check if there's actual outstanding data or if it's zero (no payment data in CSV)
  const hasOutstandingData = cash.totalOutstanding > 0;
  
  if (!hasOutstandingData) {
    return (
      <div className="space-y-6">
        <DataGapBanner
          severity="info"
          title="Outstanding Balance Data Not Detected"
          message="Outstanding balance columns were not found in your CSV files. To enable cash flow tracking, include columns such as: Outstanding Amount, Balance, AR Balance, or Receivable."
        />
        
        <EmptyState 
          title="Cash analytics disabled" 
          message="Upload data with outstanding balance information to track unpaid balances, collection efficiency, and cash flow metrics."
        />
        
        <DecisionCard decision={decisions.bp3} />
      </div>
    );
  }

  const stuckIsHigh = cash.stuckPct > CASH_THRESHOLDS.ABOVE_HEALTHY;
  const top5Debtors = topCustomersByOutstanding.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total Billed"
          value={formatCurrency(cash.totalBilled)}
        />
        <MetricCard
          label="Total Outstanding"
          value={formatCurrency(cash.totalOutstanding)}
        />
        <MetricCard
          label="Stuck %"
          value=""
          delta={stuckIsHigh ? "Requires attention" : cash.stuckPct >= CASH_THRESHOLDS.NORMAL ? "Within normal range" : "Healthy"}
          deltaDirection={stuckIsHigh ? "down" : "neutral"}
          className={stuckIsHigh ? "border-destructive/50" : undefined}
        />
      </div>

      {top5Debtors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Debtors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top5Debtors.map((debtor, idx) => (
                    <TableRow key={debtor.customer}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {debtor.customerName || debtor.customer}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          stuckIsHigh ? "text-destructive" : ""
                        }`}
                      >
                        {formatCurrency(debtor.outstanding)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <DecisionCard decision={decisions.bp3} />
    </div>
  );
}
