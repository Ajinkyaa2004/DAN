"use client";

import { useState } from "react";
import type { AnalysisResponse } from "@/lib/types";
import { formatCurrency, formatCompact } from "@/lib/formatters";
import { DecisionCard } from "@/components/shared/DecisionCard";
import { DataGapBanner } from "@/components/shared/DataGapBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";

interface BP6SeasonalityProps {
  data: AnalysisResponse;
}

export function BP6Seasonality({ data }: BP6SeasonalityProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const seasonality = data.seasonality;

  // Handle empty seasonality data
  if (!seasonality || seasonality.length === 0) {
    return (
      <section className="space-y-6">
        <h3 className="text-lg font-semibold">BP6 -- Seasonality</h3>
        <DataGapBanner
          severity="info"
          title="Date Column Required"
          message="Seasonality analysis requires a date column (e.g., Invoice Date, Transaction Date, Sale Date). Include date information in your CSV to unlock quarterly trends, peak period detection, and seasonal hiring recommendations."
        />
        <EmptyState 
          title="Seasonality analytics disabled" 
          message="Upload data with date columns to analyze seasonal patterns and revenue distribution across quarters."
        />
      </section>
    );
  }

  // Find peak and trough periods
  const peak = seasonality.reduce((max, p) =>
    p.revenue > max.revenue ? p : max
  );
  const trough = seasonality.reduce((min, p) =>
    p.revenue < min.revenue ? p : min
  );

  return (
    <section className="space-y-6">
      {/* Header with toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">BP6 -- Seasonality</h3>
        <div className="flex gap-1">
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
          >
            <LineChartIcon className="h-4 w-4 mr-1 sm:mr-0" />
            <span className="sm:hidden">Line</span>
          </Button>
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
          >
            <BarChart3 className="h-4 w-4 mr-1 sm:mr-0" />
            <span className="sm:hidden">Bar</span>
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px] sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={seasonality}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  formatCurrency(value ?? 0),
                  "Revenue",
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 5, strokeWidth: 0 }}
                activeDot={{ r: 7 }}
                connectNulls
              />
            </LineChart>
          ) : (
            <BarChart data={seasonality}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  formatCurrency(value ?? 0),
                  "Revenue",
                ]}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Peak / Trough summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-success/10 p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Peak Period
          </p>
          <p className="text-lg font-semibold">{peak.period}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(peak.revenue)}
          </p>
        </div>
        <div className="rounded-lg bg-warning/10 p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Trough Period
          </p>
          <p className="text-lg font-semibold">{trough.period}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(trough.revenue)}
          </p>
        </div>
      </div>

      {/* Collapsible data table */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          View raw data ({seasonality.length} periods)
        </summary>
        <div className="mt-3 overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasonality.map((row) => (
                <TableRow key={row.period}>
                  <TableCell>{row.period}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>

      {/* Decision */}
      <DecisionCard decision={data.decisions.bp6} />
    </section>
  );
}
