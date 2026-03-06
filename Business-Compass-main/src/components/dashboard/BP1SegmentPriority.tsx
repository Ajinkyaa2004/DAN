"use client";

import type { AnalysisResponse } from "@/lib/types";
import { formatCurrency, formatPercent, formatPercentPlain } from "@/lib/formatters";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BP1SegmentPriority({ data }: { data: AnalysisResponse }) {
  const { segments, decisions } = data;

  if (!segments || segments.length === 0) {
    return <EmptyState title="No segment data" message="Upload sales data to see segment breakdown." />;
  }

  const totalRevenue = segments.reduce((sum, s) => sum + s.revenue, 0);
  
  // Debug logging to verify no filtering
  console.log('\n📊 BP1SegmentPriority - DISPLAYING REVENUE:');
  console.log('Number of segments being displayed:', segments.length);
  segments.forEach(seg => {
    console.log(`  ${seg.name}: ${seg.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  });
  console.log('  TOTAL displayed:', totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  console.log('  ✅ This total should match Step 6 from data pipeline\n');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Segment Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-right">YoY %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment.name}>
                    <TableCell className="font-medium">{segment.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(segment.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentPlain(segment.sharePct)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        segment.yoyPct !== null && segment.yoyPct >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {formatPercent(segment.yoyPct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPercentPlain(100, 0)}
                  </TableCell>
                  <TableCell className="text-right" />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DecisionCard decision={decisions.bp1} />
    </div>
  );
}
