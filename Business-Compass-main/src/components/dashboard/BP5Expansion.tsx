"use client";

import type { AnalysisResponse } from "@/lib/types";
import { formatPercentPlain, formatPercent } from "@/lib/formatters";
import { DecisionCard } from "@/components/shared/DecisionCard";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BP5ExpansionProps {
  data: AnalysisResponse;
}

export function BP5Expansion({ data }: BP5ExpansionProps) {
  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold">BP5 -- Expansion Segments</h3>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {data.expansion.map((item) => {
          const isPositive = item.yoyPct !== null && item.yoyPct >= 0;

          return (
            <Card key={item.segment}>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="text-base font-semibold">{item.segment}</h4>
                  <p className="text-sm text-muted-foreground">
                    vs {data.primarySegment} (primary)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* % of Primary */}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      % of Primary
                    </p>
                    <p className="text-xl font-semibold">
                      {formatPercentPlain(item.pctOfPrimary)}
                    </p>
                  </div>

                  {/* YoY Growth */}
                  <div>
                    <p className="text-sm text-muted-foreground">YoY Growth</p>
                    <div className="flex items-center gap-1.5">
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <p
                        className={`text-xl font-semibold ${
                          isPositive ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatPercent(item.yoyPct)}
                      </p>
                    </div>
                  </div>
                </div>

                <DecisionCard decision={item.decision} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
