"use client";

import { AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataGapBannerProps {
  severity: "error" | "warning" | "info";
  message: string;
  title?: string;
  className?: string;
}

export function DataGapBanner({
  severity,
  message,
  title,
  className,
}: DataGapBannerProps) {
  const defaultTitle = severity === "error" ? "Data Error" : "Data Gap";
  
  return (
    <div
      className={cn(
        "flex items-start gap-2 sm:gap-3 rounded-lg border p-3 sm:p-4",
        severity === "error" &&
          "border-destructive/50 bg-destructive/10 text-destructive",
        severity === "warning" &&
          "border-warning/50 bg-warning/10 text-warning",
        severity === "info" &&
          "border-primary/50 bg-primary/10 text-primary",
        className
      )}
    >
      {severity === "info" ? (
        <Info className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
      ) : severity === "error" ? (
        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium wrap-break-word">{title || defaultTitle}</p>
        <p className="text-xs sm:text-sm mt-1 opacity-90 wrap-break-word">{message}</p>
      </div>
    </div>
  );
}
