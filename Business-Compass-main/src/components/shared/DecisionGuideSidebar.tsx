"use client";

import { DECISION_GUIDE } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, X, TrendingUp, DollarSign, Users, Target, AlertTriangle, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DecisionGuideSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapping for each BP
const BP_ICONS: Record<string, any> = {
  "BP1": Target,
  "BP2": TrendingUp,
  "BP3": AlertTriangle,
  "BP4": Users,
  "BP5": Activity,
  "BP6": Calendar,
  "BP7": Target,
  "BP8": Users,
  "BP9": DollarSign,
};

// Color coding for BP categories
const getBPColor = (bp: string): string => {
  const num = parseInt(bp.replace("BP", ""));
  if (num <= 3) return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
  if (num <= 6) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950";
  return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950";
};

export function DecisionGuideSidebar({
  isOpen,
  onClose,
}: DecisionGuideSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] max-w-full bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg sm:text-xl">Decision Guide</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Business Problem Framework</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Description */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-muted/20 border-b border-border">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Reference guide for interpreting metrics and recommended actions across all business problems.
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 sm:p-6 space-y-3">
            {DECISION_GUIDE.map((row, index) => {
              const Icon = BP_ICONS[row.bp] || Target;
              const colorClass = getBPColor(row.bp);
              
              return (
                <div
                  key={row.bp}
                  className={cn(
                    "group rounded-lg border border-border bg-card hover:bg-muted/30 transition-all duration-200 hover:shadow-md hover:border-primary/30",
                    "p-4 space-y-3"
                  )}
                >
                  {/* BP Header */}
                  <div className="flex items-center gap-3">
                    <Badge className={cn("font-semibold text-sm px-3 py-1", colorClass)}>
                      {row.bp}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{row.metric}</span>
                    </div>
                  </div>

                  {/* Condition & Action */}
                  <div className="grid grid-cols-2 gap-4 pl-1">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Condition
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {row.condition}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Recommended Action
                      </p>
                      <p className="text-sm text-foreground">
                        {row.action}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="px-6 pb-45">
            <div className="rounded-lg bg-muted/50 border border-border p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Note:</span> These are general guidelines. 
                Actual thresholds and actions should be tailored to your specific business context, 
                industry, and growth stage.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
