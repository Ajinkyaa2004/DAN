/**
 * Intelligent validation layer for Sales Analysis Dashboard
 * Handles demo-scale vs production-scale datasets gracefully
 */

import type { AnalysisResponse } from "./types";
import { CONCENTRATION_THRESHOLDS, VALIDATION_THRESHOLDS } from "./constants";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationMessage {
  severity: ValidationSeverity;
  title: string;
  message: string;
  module?: string;
}

export interface DatasetProfile {
  scale: "demo" | "small" | "medium" | "large";
  totalInvoices: number;
  totalRevenue: number;
  uniqueCustomers: number;
  branches: number;
  dateRange: { start: string; end: string } | null;
  hasHistoricalData: boolean;
  hasMultiYearData: boolean;
  hasDateColumn: boolean;
  hasPaymentData: boolean;
}

/**
 * Analyze dataset and determine its scale/completeness
 */
export function analyzeDataset(data: AnalysisResponse): DatasetProfile {
  const totalInvoices = data.meta?.totalInvoices || 0;
  const totalRevenue = data.segments?.reduce((sum, s) => sum + s.revenue, 0) || 0;
  const uniqueCustomers = data.meta?.totalCustomers || 0;
  const branches = data.segments?.length || 0;
  
  // Check for date data
  const hasDateColumn = Boolean(
    data.meta?.dataRange?.start && 
    data.meta?.dataRange?.end &&
    data.meta.dataRange.start !== data.meta.dataRange.end
  );
  
  // Check for multi-year data
  const hasMultiYearData = hasDateColumn && (() => {
    try {
      const start = new Date(data.meta!.dataRange!.start);
      const end = new Date(data.meta!.dataRange!.end);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > VALIDATION_THRESHOLDS.MULTI_YEAR_DAYS;
    } catch {
      return false;
    }
  })();
  
  // Check for payment/AR data
  const hasPaymentData = 
    data.cash.totalOutstanding > 0 || 
    data.topCustomersByOutstanding.length > 0;
  
  // Detect historical data upload (would be set by parser)
  const hasHistoricalData = data.revenueByFy.length > 1;
  
  // Determine scale
  let scale: DatasetProfile["scale"];
  if (totalInvoices >= VALIDATION_THRESHOLDS.LARGE_INVOICE_COUNT || totalRevenue >= VALIDATION_THRESHOLDS.LARGE_REVENUE) {
    scale = "large";
  } else if (totalInvoices >= VALIDATION_THRESHOLDS.MEDIUM_INVOICE_COUNT || totalRevenue >= VALIDATION_THRESHOLDS.MEDIUM_REVENUE) {
    scale = "medium";
  } else if (totalInvoices >= VALIDATION_THRESHOLDS.SMALL_INVOICE_COUNT || totalRevenue >= VALIDATION_THRESHOLDS.SMALL_REVENUE) {
    scale = "small";
  } else {
    scale = "demo";
  }
  
  return {
    scale,
    totalInvoices,
    totalRevenue,
    uniqueCustomers,
    branches,
    dateRange: hasDateColumn ? data.meta!.dataRange! : null,
    hasHistoricalData,
    hasMultiYearData,
    hasDateColumn,
    hasPaymentData,
  };
}

/**
 * Validate dataset size with intelligent thresholds
 */
export function validateDatasetSize(profile: DatasetProfile): ValidationMessage | null {
  const { scale, totalInvoices, hasHistoricalData, hasMultiYearData } = profile;
  
  // Only show warning if truly problematic
  if (totalInvoices < VALIDATION_THRESHOLDS.DEMO_INVOICE_THRESHOLD && !hasHistoricalData && !hasMultiYearData) {
    return {
      severity: "warning",
      title: "Small Dataset Detected",
      message: `Dataset contains ${totalInvoices} transactions. For comprehensive insights, consider uploading additional historical data or complete sales records.`,
    };
  }
  
  // Informational for demo/small scale
  if (scale === "demo" || scale === "small") {
    return {
      severity: "info",
      title: "Demo-Scale Dataset",
      message: `Analyzing ${totalInvoices.toLocaleString()} transactions. Dashboard is optimized for datasets of all sizes.`,
    };
  }
  
  return null;
}

/**
 * Validate concentration risk with context awareness
 */
export function validateConcentration(
  concentration: { top5Pct: number; top1CustomerPct: number },
  uniqueCustomers: number
): { message: string; severity: ValidationSeverity } | null {
  const { top5Pct, top1CustomerPct } = concentration;
  
  // Structurally concentrated (low customer count)
  if (uniqueCustomers <= CONCENTRATION_THRESHOLDS.STRUCTURAL_SIZE) {
    return {
      severity: "info",
      message: `Dataset has ${uniqueCustomers} customers. Concentration metrics reflect structural dataset size rather than business risk.`,
    };
  }
  
  // Real concentration risk
  if (uniqueCustomers >= CONCENTRATION_THRESHOLDS.MINIMUM_REAL_RISK && top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_HIGH_RISK) {
    return {
      severity: "warning",
      message: `High concentration: Top customer represents ${top1CustomerPct.toFixed(1)}% of revenue. Consider diversifying customer base.`,
    };
  }
  
  // Moderate concentration
  if (uniqueCustomers >= CONCENTRATION_THRESHOLDS.MINIMUM_REAL_RISK && top5Pct > CONCENTRATION_THRESHOLDS.TOP5_MODERATE) {
    return {
      severity: "info",
      message: `Top 5 customers represent ${top5Pct.toFixed(1)}% of revenue. Monitor concentration trends.`,
    };
  }
  
  return null;
}

/**
 * Validate cash/payment data availability
 */
export function validateCashData(hasPaymentData: boolean): ValidationMessage | null {
  if (!hasPaymentData) {
    return {
      severity: "info",
      title: "Payment Data Not Detected",
      message: "Payment or accounts receivable columns were not found. Cash analytics are disabled. To enable, include payment status, payment date, or outstanding amount columns in your CSV.",
    };
  }
  
  return null;
}

/**
 * Validate seasonality data requirements
 */
export function validateSeasonalityData(hasDateColumn: boolean): ValidationMessage | null {
  if (!hasDateColumn) {
    return {
      severity: "info",
      title: "Date Column Required",
      message: "Seasonality analysis requires a date column (e.g., Invoice Date, Transaction Date). Include date information to unlock quarterly trends and peak period detection.",
    };
  }
  
  return null;
}

/**
 * Validate FY/historical data
 */
export function validateHistoricalData(
  hasHistoricalData: boolean,
  hasMultiYearData: boolean
): ValidationMessage | null {
  if (!hasHistoricalData && !hasMultiYearData) {
    return {
      severity: "info",
      title: "Historical Data Not Available",
      message: "Year-over-year growth analysis requires historical data. Upload a historical sales file or include multiple years in your date range for trend analysis.",
    };
  }
  
  return null;
}

/**
 * Check if payment columns exist but contain nulls (data quality issue)
 */
export function validatePaymentDataQuality(
  data: AnalysisResponse,
  profile: DatasetProfile
): ValidationMessage | null {
  // This would require checking original CSV column presence
  // For now, we can infer from the data structure
  const hasSomePaymentData = data.cash.totalOutstanding > 0;
  const hasIncompletePaymentData = 
    hasSomePaymentData && 
    data.cash.stuckPct === 0 &&
    data.topCustomersByOutstanding.length === 0;
  
  if (hasIncompletePaymentData) {
    return {
      severity: "warning",
      title: "Incomplete Payment Data",
      message: "Payment columns detected but contain missing values. Outstanding balance calculations may be incomplete.",
    };
  }
  
  return null;
}

/**
 * Generate comprehensive validation report
 */
export function generateValidationReport(data: AnalysisResponse): {
  profile: DatasetProfile;
  messages: ValidationMessage[];
} {
  const profile = analyzeDataset(data);
  const messages: ValidationMessage[] = [];
  
  // Dataset size validation
  const sizeValidation = validateDatasetSize(profile);
  if (sizeValidation) messages.push(sizeValidation);
  
  // Concentration validation
  const concentrationValidation = validateConcentration(
    data.concentration,
    profile.uniqueCustomers
  );
  if (concentrationValidation) {
    messages.push({
      ...concentrationValidation,
      title: "Customer Concentration",
      module: "BP4",
    });
  }
  
  // Cash data validation
  const cashValidation = validateCashData(profile.hasPaymentData);
  if (cashValidation) {
    messages.push({ ...cashValidation, module: "BP3" });
  }
  
  // Seasonality validation
  const seasonalityValidation = validateSeasonalityData(profile.hasDateColumn);
  if (seasonalityValidation) {
    messages.push({ ...seasonalityValidation, module: "BP6" });
  }
  
  // Historical data validation
  const historicalValidation = validateHistoricalData(
    profile.hasHistoricalData,
    profile.hasMultiYearData
  );
  if (historicalValidation) {
    messages.push({ ...historicalValidation, module: "BP2" });
  }
  
  // Payment data quality
  const paymentQualityValidation = validatePaymentDataQuality(data, profile);
  if (paymentQualityValidation) {
    messages.push({ ...paymentQualityValidation, module: "BP3" });
  }
  
  return { profile, messages };
}
