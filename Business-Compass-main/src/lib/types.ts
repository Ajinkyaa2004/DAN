// ============================================================
// TypeScript interfaces for the DAN Sales Analysis Dashboard
// Extends the Lovable frontend-spec.md AnalysisResponse
// with Prompt 1 analysis outputs (forecast, churn, weekly)
// ============================================================

// --- Core analysis response (from /api/analyse) ---

export interface AnalysisResponse {
  // Existing (from Lovable spec)
  segments: Segment[];
  primarySegment: string;
  revenueByFy: RevenueByFY[];
  cash: Cash;
  topCustomersByOutstanding: CustomerOutstanding[];
  topCustomersByRevenue: CustomerRevenue[];
  concentration: Concentration;
  expansion: Expansion[];
  seasonality: SeasonalityPeriod[];
  onTrack: OnTrack;
  decisions: Decisions;

  // New (from Prompt 1 analysis)
  weeklyTrend: WeeklyDataPoint[];
  forecast: ForecastPoint[];
  customerTrends: CustomerTrendsData;
  customerPurchases: CustomerPurchase[];
  fyComparison: FYBranchTotal[];
  monthlyBranch: MonthlyBranchPoint[];
  dataGaps: DataGap[];
  meta: AnalysisMeta;
}

// --- Segment / Branch level ---

export interface Segment {
  name: string;
  revenue: number;
  sharePct: number;
  yoyPct: number | null; // null when no historical data available
}

export interface RevenueByFY {
  fy: string;
  revenue: number;
  yoyGrowthPct: number | null;
}

// --- Cash ---

export interface Cash {
  totalBilled: number;
  totalOutstanding: number;
  stuckPct: number;
}

export interface CustomerOutstanding {
  customer: string;
  customerName?: string;
  outstanding: number;
}

// --- Customers ---

export interface CustomerRevenue {
  customer: string;
  customerName?: string;
  revenue: number;
}

export interface Concentration {
  top5Pct: number;
  top1CustomerPct: number;
}

// --- Expansion ---

export interface Expansion {
  segment: string;
  pctOfPrimary: number;
  yoyPct: number | null; // null when no historical data available
  decision: string;
}

// --- Seasonality ---

export interface SeasonalityPeriod {
  period: string;
  revenue: number;
}

// --- On Track ---

export interface OnTrack {
  target: number;
  ytd: number;
  onTrackPct: number;
  ytdVsLastYearPct: number | null; // null when no historical data available
  decision: string;
}

// --- Decisions ---

export interface Decisions {
  bp1: string;
  bp2: string;
  bp3: string;
  bp4: string;
  bp5: Record<string, string>;
  bp6: string;
  bp7: string;
  bp8?: string;
  bp9?: string;
}

// --- Weekly trend (for BP6 drill-down) ---

export interface WeeklyDataPoint {
  fy: string;
  fyWeek: number;
  branch: string;
  revenue: number;
}

// --- Forecast (Prophet output for BP7) ---

export interface ForecastPoint {
  fy: string;
  fyWeek: number;
  branch: string;
  forecastTotal: number;
  lowerBound: number;
  upperBound: number;
  isActual: boolean;
}

// --- Customer Trends (BP8) ---

export interface CustomerTrendsData {
  dropping: CustomerTrend[];
  rising: CustomerTrend[];
  churnCount: number;
  acquisitionCount: number;
}

export interface CustomerTrend {
  customer: string;
  customerName?: string;
  priorYearRevenue: number;
  currentYearRevenue: number;
  changePct: number;
}

// --- Customer Purchase Detail (BP9) ---

export interface CustomerPurchase {
  customer: string;
  customerName?: string;
  issueDate: string;
  branch: string;
  invoiceId: number;
  invoiceNum: string;
  total: number;
}

// --- FY × Branch totals (for BP2 bar chart) ---

export interface FYBranchTotal {
  fy: string;
  branch: string;
  total: number;
}

// --- Monthly × Branch (for BP6 monthly line) ---

export interface MonthlyBranchPoint {
  month: string;
  branch: string;
  revenue: number;
}

// --- Data gaps (for banners) ---

export interface DataGap {
  field: string;
  severity: "critical" | "warning" | "info";
  message: string;
  affectedModules: string[];
}

// --- Metadata ---

export interface AnalysisMeta {
  dataRange: { start: string; end: string };
  totalInvoices: number;
  totalCustomers: number;
  branches: string[];
  lastIngestion: string;
  modelVersion: string;
}

// --- Decision Guide (static reference) ---

export interface DecisionGuideRow {
  bp: string;
  metric: string;
  condition: string;
  action: string;
}

// --- Filter state ---

export interface FilterState {
  branches: string[];
  fySelectAll: boolean;
  selectedFYs: string[];
  customers: string[];
  yearRange: [number, number];
  dateRange: { start: string; end: string };
  quarters: string[];
  selectedWeeks: number[];
}

// --- Industry templates (Setup page) ---

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
}

// --- Tab definitions ---

export interface TabDefinition {
  id: string;
  label: string;
  icon: string;
}
