"use client";

import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

interface DecisionCardProps {
  decision: string;
  className?: string;
  variant?: "default" | "success" | "warning";
}

export function DecisionCard({
  decision,
  className,
  variant = "default",
}: DecisionCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-l-4 p-4",
        variant === "default" && "border-l-decision bg-decision-bg",
        variant === "success" && "border-l-success bg-success/10",
        variant === "warning" && "border-l-warning bg-warning/10",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Lightbulb
          className={cn(
            "h-5 w-5 mt-0.5 shrink-0",
            variant === "default" && "text-decision",
            variant === "success" && "text-success",
            variant === "warning" && "text-warning"
          )}
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Decision
          </p>
          <p className="font-semibold text-foreground">{decision}</p>
        </div>
      </div>
    </div>
  );
}
