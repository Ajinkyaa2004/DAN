import type { DecisionGuideRow, IndustryTemplate } from "./types";

// ============================================================
// Static constants for the DAN Sales Analysis Dashboard
// ============================================================

// --- Decision Guide reference table (shown in sidebar) ---

export const DECISION_GUIDE: DecisionGuideRow[] = [
  {
    bp: "BP1",
    metric: "Share primary",
    condition: "> 80%",
    action: "Consider diversifying",
  },
  {
    bp: "BP2",
    metric: "YoY growth",
    condition: "Declining 2 years",
    action: "Set conservative target",
  },
  {
    bp: "BP3",
    metric: "Stuck %",
    condition: "> 30%",
    action: "Prioritise collections",
  },
  {
    bp: "BP4",
    metric: "Top 5 %",
    condition: "> 60%",
    action: "Diversify \u2013 add customers",
  },
  {
    bp: "BP5",
    metric: "Expansion %",
    condition: "Growing",
    action: "On track",
  },
  {
    bp: "BP6",
    metric: "Peak",
    condition: "\u2014",
    action: "Hire before peak",
  },
  {
    bp: "BP7",
    metric: "On track %",
    condition: "< 90%",
    action: "Review pipeline",
  },
  {
    bp: "BP8",
    metric: "Churn count",
    condition: "> prior year",
    action: "Investigate lost customers",
  },
  {
    bp: "BP9",
    metric: "Avg invoice value",
    condition: "Declining",
    action: "Review pricing / mix",
  },
];

// --- Concentration risk thresholds (BP4) ---

export const CONCENTRATION_THRESHOLDS = {
  // Dataset size thresholds
  STRUCTURAL_SIZE: 5,        // ≤5 customers = structural concentration, not business risk
  MINIMUM_REAL_RISK: 10,     // ≥10 customers = large enough for real risk assessment
  
  // Top 1 customer thresholds
  TOP1_CRITICAL: 50,         // >50% = Critical single customer dependency
  TOP1_HIGH_RISK: 40,        // >40% = High concentration risk
  TOP1_MODERATE: 30,         // >30% = Moderate concentration
  TOP1_HEALTHY: 20,          // ≤20% = Healthy diversification
  
  // Top 5 customers thresholds
  TOP5_CRITICAL: 80,         // >80% = Critical concentration in few customers
  TOP5_HIGH_RISK: 70,        // >70% = High concentration risk
  TOP5_MODERATE: 60,         // >60% = Moderate concentration
  TOP5_MONITORING: 40,       // >40% = Should monitor trends
  TOP5_HEALTHY: 40,          // ≤40% = Well-diversified
} as const;

// --- Expansion segment thresholds (BP5) ---

export const EXPANSION_THRESHOLDS = {
  // Segment size relative to primary segment (%)
  ALMOST_EQUAL: 80,          // ≥80% = Almost equal to primary, risk of over-focus
  STRONG_SECONDARY: 50,      // ≥50% = Strong secondary segment worth monitoring
  GROWING: 20,               // ≥20% = Growing segment with expansion opportunity
  SMALL: 20,                 // <20% = Small segment with high growth potential
} as const;

// --- Cash flow thresholds (BP3) ---

export const CASH_THRESHOLDS = {
  // Stuck percentage thresholds
  CRITICAL: 95,              // >95% = Critical - almost all revenue uncollected
  HIGH_RISK: 60,             // >60% = High risk - majority uncollected
  ABOVE_HEALTHY: 30,         // >30% = Above healthy threshold
  NORMAL: 15,                // >15% = Within normal range
  EXCELLENT: 15,             // ≤15% = Excellent collections
} as const;

// --- On Track thresholds (BP7) ---

export const ON_TRACK_THRESHOLDS = {
  BELOW_TARGET: 90,          // <90% = Below target, review pipeline
  ON_TARGET_MIN: 90,         // ≥90% = On track range
  ON_TARGET_MAX: 110,        // ≤110% = On track range
  ABOVE_TARGET: 110,         // >110% = Exceeding target, consider raising
} as const;

// --- Data validation thresholds ---

export const VALIDATION_THRESHOLDS = {
  // Branch column detection
  BRANCH_COVERAGE_MIN: 0.5,           // 50% minimum coverage for valid branch column
  BRANCH_UNIQUE_MIN: 2,               // Minimum unique branch values
  BRANCH_UNIQUE_MAX: 10,              // Maximum unique branch values (sanity check)
  
  // Historical data requirements
  MINIMUM_PERIODS_FOR_TRENDS: 2,     // Minimum periods for YoY/trend analysis
  MULTI_YEAR_DAYS: 365,              // Days threshold for multi-year detection
  
  // Dataset scale classification
  LARGE_INVOICE_COUNT: 10000,        // ≥10k invoices = large scale
  LARGE_REVENUE: 10_000_000,         // ≥$10M = large scale
  MEDIUM_INVOICE_COUNT: 1000,        // ≥1k invoices = medium scale
  MEDIUM_REVENUE: 1_000_000,         // ≥$1M = medium scale
  SMALL_INVOICE_COUNT: 200,          // ≥200 invoices = small scale
  SMALL_REVENUE: 100_000,            // ≥$100k = small scale
  DEMO_INVOICE_THRESHOLD: 200,       // <200 invoices = demo scale
} as const;

// --- Industry templates (Setup page) ---

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "multi-region",
    name: "Multi-region services",
    description: "Geographic segments (regions, states, territories)",
  },
  {
    id: "multi-channel",
    name: "Multi-channel retailer",
    description: "Channel segments (Online, Wholesale, Retail)",
  },
  {
    id: "b2b-saas",
    name: "B2B SaaS",
    description: "Product/tier segments (Enterprise, Pro, Starter)",
  },
  {
    id: "franchise",
    name: "Franchise / multi-location",
    description: "Location-based segments",
  },
  {
    id: "wholesale",
    name: "Wholesale / distribution",
    description: "Product category segments",
  },
];

// --- Tab configuration ---

export const DASHBOARD_TABS = [
  { id: "bp1", label: "Focus", icon: "Target" },
  { id: "bp2", label: "Targets", icon: "TrendingUp" },
  { id: "bp3", label: "Cash", icon: "DollarSign" },
  { id: "bp4", label: "Concentration", icon: "Users" },
  { id: "bp5", label: "Expansion", icon: "Expand" },
  { id: "bp6", label: "Seasonality", icon: "Calendar" },
  { id: "bp7", label: "On Track", icon: "CheckCircle" },
  { id: "bp8", label: "Trends", icon: "ArrowUpDown" },
] as const;

// --- Dynamic branch color generator ---

/**
 * Generate a color for a branch name using a hash function
 * Ensures consistent colors across app for same branch name
 */
export function getBranchColor(branchName: string): string {
  const colors = [
    "hsl(217, 91%, 50%)",
    "hsl(142, 71%, 45%)",
    "hsl(38, 92%, 50%)",
    "hsl(262, 83%, 58%)",
    "hsl(0, 72%, 51%)",
    "hsl(187, 85%, 43%)",
    "hsl(330, 81%, 60%)",
    "hsl(50, 95%, 50%)",
  ];
  
  // Simple hash function to get consistent color for branch name
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// --- FY colours for multi-FY charts ---

export const FY_COLORS: string[] = [
  "hsl(217, 91%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 72%, 51%)",
  "hsl(187, 85%, 43%)",
  "hsl(330, 81%, 60%)",
  "hsl(50, 95%, 50%)",
];

// --- Default filter state ---
// Note: Branches are now loaded dynamically from uploaded data
// No default branches - extracted from actual CSV files

// Financial years are now generated dynamically from date range in uploaded data

// --- API configuration ---

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
