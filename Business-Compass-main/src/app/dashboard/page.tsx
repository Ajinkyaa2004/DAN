"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResponse } from "@/lib/types";
import { generateValidationReport } from "@/lib/validation";
import { FilterProvider } from "@/lib/store/filter-context";
import { DASHBOARD_TABS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DecisionGuideSidebar } from "@/components/shared/DecisionGuideSidebar";
import { DatasetProfileCard } from "@/components/shared/DatasetProfileCard";
import { BP1SegmentPriority } from "@/components/dashboard/BP1SegmentPriority";
import { BP2TargetSetting } from "@/components/dashboard/BP2TargetSetting";
import { BP3CashOutstanding } from "@/components/dashboard/BP3CashOutstanding";
import { BP4Concentration } from "@/components/dashboard/BP4Concentration";
import { BP5Expansion } from "@/components/dashboard/BP5Expansion";
import { BP6Seasonality } from "@/components/dashboard/BP6Seasonality";
import { BP7OnTrack } from "@/components/dashboard/BP7OnTrack";
import { CustomerTrends } from "@/components/dashboard/CustomerTrends";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Expand,
  Calendar,
  CheckCircle,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Icon map — matches DASHBOARD_TABS icon strings to actual components
// ---------------------------------------------------------------------------
const TAB_ICONS: Record<string, React.ElementType> = {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Expand,
  Calendar,
  CheckCircle,
  ArrowUpDown,
};

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(false);

  useEffect(() => {
    // Check if we have parsed data or sample data in sessionStorage
    const parsedDataFlag = sessionStorage.getItem("useParsedData");
    const sampleDataFlag = sessionStorage.getItem("useSampleData");
    const storedData = sessionStorage.getItem("dashboardData");
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        console.log('\n\n');
        console.log('='.repeat(70));
        console.log('📊 DASHBOARD DATA LOADED');
        console.log('='.repeat(70));
        
        const totalRev = parsedData.segments?.reduce((sum: number, s: any) => sum + s.revenue, 0) || 0;
        const totalInvoices = parsedData.meta?.totalInvoices || 0;
        const totalCustomers = parsedData.meta?.totalCustomers || 0;
        
        console.log('\n📋 DATA SUMMARY:');
        console.log('  Total Branches:', parsedData.segments?.length || 0);
        console.log('  Total Invoices:', totalInvoices.toLocaleString());
        console.log('  Total Customers:', totalCustomers.toLocaleString());
        console.log('  Total Revenue:', `$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        
        console.log('\n💰 BRANCH BREAKDOWN:');
        parsedData.segments?.forEach((seg: any) => {
          const pct = totalRev > 0 ? (seg.revenue / totalRev * 100).toFixed(1) : '0.0';
          console.log(`  ${seg.name}: $${seg.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct}%)`);
        });
        
        // Data quality checks
        console.log('\n✅ DATA QUALITY CHECKS:');
        if (totalInvoices > 50000) {
          console.log('  ✅ Large dataset (', totalInvoices.toLocaleString(), '+ transactions)');
        } else if (totalInvoices > 10000) {
          console.log('  ✅ Medium dataset (', totalInvoices.toLocaleString(), 'transactions)');
        } else if (totalInvoices > 1000) {
          console.log('  ℹ️  Dataset (', totalInvoices.toLocaleString(), 'transactions)');
        } else if (totalInvoices >= 200) {
          console.log('  ℹ️  Demo-scale dataset (', totalInvoices.toLocaleString(), 'transactions)');
        } else {
          console.log('  ⚠️  Very small dataset (', totalInvoices.toLocaleString(), 'transactions)');
        }
        
        if (totalRev > 100000000) {
          console.log('  ✅ Revenue: $', (totalRev / 1000000).toFixed(1), 'M+');
        } else if (totalRev > 10000000) {
          console.log('  ✅ Revenue: $', (totalRev / 1000000).toFixed(1), 'M');
        } else if (totalRev > 1000000) {
          console.log('  ℹ️  Revenue: $', (totalRev / 1000000).toFixed(1), 'M');
        } else if (totalRev > 100000) {
          console.log('  ℹ️  Revenue: $', totalRev.toLocaleString());
        } else {
          console.log('  ⚠️  Revenue: $', totalRev.toLocaleString());
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('Dashboard supports datasets of all sizes');
        console.log('='.repeat(70) + '\n\n');
        
        setData(parsedData);
        setIsSampleData(sampleDataFlag === "true"); // Only mark as sample if explicitly set
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to parse dashboard data:", error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Loading dashboard data...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your analysis
          </p>
        </div>
      </div>
    );
  }

  // Empty state (no data loaded yet)
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader onOpenGuide={() => setSidebarOpen(true)} data={null} />
        <div className="flex items-center justify-center pt-20">
          <EmptyState
            title="No data available"
            description="Upload your sales data to view comprehensive business analysis and insights."
            action={{
              label: "Upload Data",
              onClick: () => router.push("/setup"),
            }}
          />
        </div>
        <DecisionGuideSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    );
  }

  // Data loaded successfully
  return (
    <FilterProvider>
      <div className="min-h-screen bg-background">
        <DashboardHeader onOpenGuide={() => setSidebarOpen(true)} data={data} />

        {/* Intelligent Validation Banners */}
        {!isSampleData && data && (() => {
          const validation = generateValidationReport(data);
          const warningMessages = validation.messages.filter(m => m.severity === 'warning');
          const infoMessages = validation.messages.filter(m => m.severity === 'info');
          
          return (
            <>
              {/* Warning-level messages */}
              {warningMessages.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
                  <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        {warningMessages.map((msg, idx) => (
                          <div key={idx}>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                              {msg.title}
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                              {msg.message}
                            </p>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          sessionStorage.clear();
                          router.push('/setup');
                        }}
                        className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700"
                      >
                        Re-Upload Files
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Sample Data Banner */}
        {isSampleData && (
          <div className="bg-blue-50 border-b border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Demo Mode:</strong> You&apos;re viewing sample data based on your selected template. Upload your own CSV/Excel files to analyze your actual business data.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/setup")}
                  className="ml-auto"
                >
                  Upload Data
                </Button>
              </div>
            </div>
          </div>
        )}



        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Dataset Profile Summary */}
          {!isSampleData && data && (() => {
            const validation = generateValidationReport(data);
            return (
              <div className="mb-6">
                <DatasetProfileCard profile={validation.profile} />
              </div>
            );
          })()}
          
          <Tabs defaultValue="bp1" className="w-full">
            <div className="overflow-x-auto -mx-4 px-4 mb-6">
              <TabsList className="inline-flex w-full min-w-max md:w-full flex-nowrap md:flex-wrap">
                {DASHBOARD_TABS.map((tab) => {
                  const Icon = TAB_ICONS[tab.icon];
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="whitespace-nowrap">
                      {Icon && <Icon className="mr-1.5 h-4 w-4 shrink-0" />}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.id.toUpperCase()}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value="bp1">
              <BP1SegmentPriority data={data} />
            </TabsContent>

            <TabsContent value="bp2">
              <BP2TargetSetting data={data} />
            </TabsContent>

            <TabsContent value="bp3">
              <BP3CashOutstanding data={data} />
            </TabsContent>

            <TabsContent value="bp4">
              <BP4Concentration data={data} />
            </TabsContent>

            <TabsContent value="bp5">
              <BP5Expansion data={data} />
            </TabsContent>

            <TabsContent value="bp6">
              <BP6Seasonality data={data} />
            </TabsContent>

            <TabsContent value="bp7">
              <BP7OnTrack data={data} />
            </TabsContent>

            <TabsContent value="bp8">
              <CustomerTrends data={data} />
            </TabsContent>
          </Tabs>
        </main>

        <DecisionGuideSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </FilterProvider>
  );
}
