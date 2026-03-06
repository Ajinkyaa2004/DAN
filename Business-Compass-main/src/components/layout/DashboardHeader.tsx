"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excel-export";
import type { AnalysisResponse } from "@/lib/types";

interface DashboardHeaderProps {
  onOpenGuide: () => void;
  data?: AnalysisResponse | null;
}

export function DashboardHeader({ onOpenGuide, data }: DashboardHeaderProps) {
  const router = useRouter();
  
  const handleRunAgain = () => {
    // Clear all cached data to force fresh analysis
    sessionStorage.clear();
    console.log('🧹 Cleared sessionStorage - forcing fresh analysis');
    router.push("/setup");
  };

  const handleExport = () => {
    if (!data) {
      alert("No data available to export.");
      return;
    }
    try {
      exportToExcel(data);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">
          <span className="hidden sm:inline">Sales Analysis Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </h1>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={onOpenGuide} className="hidden md:flex">
            <BookOpen className="mr-2 h-4 w-4" />
            Decision Guide
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenGuide} className="md:hidden">
            <BookOpen className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleRunAgain} className="hidden sm:flex">
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Again
          </Button>
          <Button variant="outline" size="sm" onClick={handleRunAgain} className="sm:hidden">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data}
            className="hidden sm:flex"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data}
            className="sm:hidden"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
