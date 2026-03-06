"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  deltaDirection = "neutral",
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-semibold text-foreground wrap-break-word">{value}</p>
        {delta && (
          <p
            className={cn(
              "text-xs sm:text-sm mt-1",
              deltaDirection === "up" && "text-success",
              deltaDirection === "down" && "text-destructive",
              deltaDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {delta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
