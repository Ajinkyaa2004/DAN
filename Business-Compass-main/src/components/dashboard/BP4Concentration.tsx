"use client";

import type { AnalysisResponse } from "@/lib/types";
import { validateConcentration } from "@/lib/validation";
import { formatCurrency, formatPercentPlain } from "@/lib/formatters";
import { CONCENTRATION_THRESHOLDS } from "@/lib/constants";
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

export function BP4Concentration({ data }: { data: AnalysisResponse }) {
  const { concentration, topCustomersByRevenue, decisions, meta } = data;

  if (!concentration || !topCustomersByRevenue) {
    return <EmptyState title="No concentration data" message="Upload customer data to see revenue concentration." />;
  }

  const uniqueCustomers = meta?.totalCustomers || topCustomersByRevenue.length;
  const concentrationValidation = validateConcentration(concentration, uniqueCustomers);
  
  // Determine if showing risk or just structural info
  const isRealRisk = uniqueCustomers >= CONCENTRATION_THRESHOLDS.MINIMUM_REAL_RISK && concentration.top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_HIGH_RISK;
  const isStructuralConcentration = uniqueCustomers <= CONCENTRATION_THRESHOLDS.STRUCTURAL_SIZE;
  
  const top5 = topCustomersByRevenue.slice(0, 5);
  const totalTop5Revenue = top5.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Smart validation banner */}
      {concentrationValidation && (
        <DataGapBanner
          severity={concentrationValidation.severity}
          title="Customer Concentration"
          message={concentrationValidation.message}
        />
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          label="Top 5 % of Revenue"
          value={formatPercentPlain(concentration.top5Pct)}
          delta={
            isStructuralConcentration 
              ? `${uniqueCustomers} customers in dataset`
              : isRealRisk 
                ? "High concentration risk" 
                : undefined
          }
          deltaDirection={isRealRisk ? "down" : "neutral"}
          className={isRealRisk ? "border-warning/50" : undefined}
        />
        <MetricCard
          label="Top 1 Customer %"
          value={formatPercentPlain(concentration.top1CustomerPct)}
        />
      </div>

      {top5.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top5.map((customer, idx) => (
                    <TableRow key={customer.customer}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.customerName || customer.customer}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(customer.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <DecisionCard
        decision={decisions.bp4}
        variant={isRealRisk ? "warning" : "default"}
      />
    </div>
  );
}
