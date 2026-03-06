"use client";

import { InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = "No data available",
  description,
  message,
  action,
}: EmptyStateProps) {
  const displayMessage = description || message || "Adjust your filters or upload data to see results.";
  
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <InboxIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-base sm:text-lg font-medium text-foreground">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">{displayMessage}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
