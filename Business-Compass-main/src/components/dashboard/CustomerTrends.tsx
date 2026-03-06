"use client";

import type { AnalysisResponse } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { DecisionCard } from "@/components/shared/DecisionCard";
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
import { TrendingDown, TrendingUp } from "lucide-react";

export function CustomerTrends({ data }: { data: AnalysisResponse }) {
  if (!data) return <EmptyState />;

  const { customerTrends, decisions } = data;

  if (!customerTrends) {
    return (
      <EmptyState
        title="No customer trend data"
        message="Upload multi-year data to see customer churn and acquisition."
      />
    );
  }

  const { dropping, rising, churnCount, acquisitionCount } = customerTrends;

  return (
    <div className="space-y-6">
      {/* Two-column grid: Dropping | Rising */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dropping customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Dropping
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dropping.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No customers with declining revenue.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Prior Year ($)</TableHead>
                      <TableHead className="text-right">Current Year ($)</TableHead>
                      <TableHead className="text-right">Change (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dropping.map((row) => (
                      <TableRow key={row.customer}>
                        <TableCell className="font-medium">
                          {row.customerName || row.customer}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.priorYearRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.currentYearRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatPercent(row.changePct)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rising customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Rising
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rising.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No customers with rising revenue.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Prior Year ($)</TableHead>
                      <TableHead className="text-right">Current Year ($)</TableHead>
                      <TableHead className="text-right">Change (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rising.map((row) => (
                      <TableRow key={row.customer}>
                        <TableCell className="font-medium">
                          {row.customerName || row.customer}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.priorYearRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.currentYearRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-success">
                          {formatPercent(row.changePct)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DecisionCard
        decision={
          decisions.bp8 ?? "Monitor customer churn and acquisition rates."
        }
      />
    </div>
  );
}
