"use client";

import type { AnalysisResponse } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { DecisionCard } from "@/components/shared/DecisionCard";
import { DataGapBanner } from "@/components/shared/DataGapBanner";
import { MetricCard } from "@/components/shared/MetricCard";
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

export function BP2TargetSetting({ data }: { data: AnalysisResponse }) {
  const { revenueByFy, decisions } = data;

  if (!revenueByFy || revenueByFy.length === 0) {
    return <EmptyState title="No revenue history" message="Upload multi-year data to see FY trends." />;
  }

  const hasMultipleYears = revenueByFy.length > 1;
  const hasYoyData = revenueByFy.some(fy => fy.yoyGrowthPct !== null);
  
  const growthValues = revenueByFy
    .map((fy) => fy.yoyGrowthPct)
    .filter((v): v is number => v !== null);

  const avgGrowth =
    growthValues.length > 0
      ? growthValues.reduce((sum, v) => sum + v, 0) / growthValues.length
      : null;

  return (
    <div className="space-y-6">
      {/* Show info banner if single year only */}
      {!hasMultipleYears && !hasYoyData && (
        <DataGapBanner
          severity="info"
          title="Historical Data Not Available"
          message="Year-over-year growth analysis requires multiple years of data. Upload a historical sales file or include transactions spanning multiple financial years to enable trend analysis and growth recommendations."
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>FY Revenue History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Financial Year</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">YoY Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueByFy.map((fy) => (
                  <TableRow key={fy.fy}>
                    <TableCell className="font-medium">{fy.fy}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(fy.revenue)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        fy.yoyGrowthPct === null
                          ? "text-muted-foreground"
                          : fy.yoyGrowthPct >= 0
                            ? "text-success"
                            : "text-destructive"
                      }`}
                    >
                      {formatPercent(fy.yoyGrowthPct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MetricCard
        label="Average YoY Growth"
        value={formatPercent(avgGrowth)}
        deltaDirection={
          avgGrowth === null ? "neutral" : avgGrowth >= 0 ? "up" : "down"
        }
      />

      <DecisionCard decision={decisions.bp2} />
    </div>
  );
}
