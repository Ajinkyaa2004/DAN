"use client";

import { useState } from "react";
import type { AnalysisResponse } from "@/lib/types";
import {
  formatCurrency,
  formatPercentPlain,
  formatPercent,
} from "@/lib/formatters";
import { ON_TRACK_THRESHOLDS } from "@/lib/constants";
import { DecisionCard } from "@/components/shared/DecisionCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Edit, RotateCcw } from "lucide-react";

interface BP7OnTrackProps {
  data: AnalysisResponse;
}

export function BP7OnTrack({ data }: BP7OnTrackProps) {
  const [target, setTarget] = useState(data.onTrack.target || 0);
  const [isEditing, setIsEditing] = useState(false);

  const ytd = data.onTrack.ytd || 0;
  const hasValidTarget = target > 0;
  const onTrackPct = hasValidTarget ? (ytd / target) * 100 : 0;
  const progressValue = Math.min(onTrackPct, 100);

  // Dynamic decision logic
  let decision: string;
  let variant: "default" | "success" | "warning";

  if (!hasValidTarget) {
    decision = "Set a revenue target to track progress";
    variant = "warning";
  } else if (onTrackPct < ON_TRACK_THRESHOLDS.BELOW_TARGET) {
    decision = "Review pipeline";
    variant = "warning";
  } else if (onTrackPct >= ON_TRACK_THRESHOLDS.ABOVE_TARGET) {
    decision = "Consider raising target";
    variant = "success";
  } else {
    decision = "On track";
    variant = "default";
  }

  function handleRecalculate() {
    setIsEditing(false);
  }

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold">BP7 -- On Track This Year</h3>

      {/* Revenue Target Editor */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <Label htmlFor="revenue-target" className="text-sm">
                Revenue Target
              </Label>
              {isEditing ? (
                <Input
                  id="revenue-target"
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value) || 0)}
                  placeholder="Enter annual revenue target"
                  className="mt-1"
                />
              ) : (
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {target > 0 ? formatCurrency(target) : (
                    <span className="text-muted-foreground text-base">No target set</span>
                  )}
                </p>
              )}
            </div>
            {isEditing ? (
              <Button size="sm" onClick={handleRecalculate} className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4 mr-2 sm:mr-0" />
                <span className="sm:hidden">Recalculate</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2 sm:mr-0" />
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{hasValidTarget ? formatPercentPlain(onTrackPct) : '—'}</span>
            </div>
            <Progress value={hasValidTarget ? progressValue : 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* 3 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="YTD Revenue"
          value={formatCurrency(ytd)}
        />
        <MetricCard
          label="On Track %"
          value={hasValidTarget ? formatPercentPlain(onTrackPct) : '—'}
          delta={
            !hasValidTarget
              ? "Set target to track"
              : onTrackPct >= 100
              ? "Ahead of target"
              : "Behind target"
          }
          deltaDirection={!hasValidTarget ? "neutral" : onTrackPct >= 100 ? "up" : "down"}
        />
        <MetricCard
          label="YTD vs Last Year"
          value={formatPercent(data.onTrack.ytdVsLastYearPct)}
          delta={formatPercent(data.onTrack.ytdVsLastYearPct)}
          deltaDirection={
            data.onTrack.ytdVsLastYearPct !== null && data.onTrack.ytdVsLastYearPct >= 0 ? "up" : "down"
          }
        />
      </div>

      {/* Decision Card */}
      <DecisionCard decision={decision} variant={variant} />
    </section>
  );
}
