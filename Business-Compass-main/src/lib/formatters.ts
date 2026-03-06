// ============================================================
// Number and currency formatting utilities
// Ported from Lovable mockData.ts, enhanced for DAN project
// ============================================================

/**
 * Format a number as AUD currency (no decimals).
 * Example: 2450000 → "$2,450,000"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "\u2014";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format as currency with decimals for smaller amounts.
 * Example: 3917.45 → "$3,917.45"
 */
export function formatCurrencyPrecise(value: number | null | undefined): string {
  if (value === null || value === undefined) return "\u2014";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as a signed percentage.
 * Example: 8.2 → "+8.2%", -2.3 → "-2.3%"
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return "\u2014";
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Format a number as an unsigned percentage.
 * Example: 52.1 → "52.1%"
 */
export function formatPercentPlain(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return "\u2014";
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a large number with K/M suffix.
 * Example: 2450000 → "$2.5M", 153000 → "$153K"
 */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "\u2014";
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format a number with commas.
 * Example: 63048 → "63,048"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "\u2014";
  return new Intl.NumberFormat("en-AU").format(value);
}
