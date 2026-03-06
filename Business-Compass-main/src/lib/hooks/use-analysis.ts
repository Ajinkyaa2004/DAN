"use client";

import { useState, useCallback } from "react";
import type { AnalysisResponse } from "@/lib/types";
import { runAnalysis } from "@/lib/api-client";

interface UseAnalysisReturn {
  data: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  analyse: (params: {
    files?: File[];
    template?: string;
    revenueTarget?: number;
    segmentNames?: string[];
  }) => Promise<void>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(
    async (params: {
      files?: File[];
      template?: string;
      revenueTarget?: number;
      segmentNames?: string[];
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await runAnalysis(params);
        setData(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Analysis failed";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, analyse, reset };
}
