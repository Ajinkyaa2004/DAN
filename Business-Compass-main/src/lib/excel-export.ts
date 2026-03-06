import * as XLSX from "xlsx";
import type { AnalysisResponse } from "./types";
import { CONCENTRATION_THRESHOLDS } from "./constants";

/**
 * Export analysis data to Excel file
 */
export function exportToExcel(data: AnalysisResponse) {
  const workbook = XLSX.utils.book_new();

  // Calculate total revenue from segments
  const totalRevenue = data.segments.reduce((sum, seg) => sum + seg.revenue, 0);

  // Sheet 1: Summary
  const summaryData = [
    ["Sales Analysis Dashboard - Export"],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Total Revenue", `$${totalRevenue.toLocaleString()}`],
    ["Total Invoices", data.meta.totalInvoices.toString()],
    ["Unique Customers", data.meta.totalCustomers.toString()],
    ["Date Range", `${data.meta.dataRange.start} to ${data.meta.dataRange.end}`],
    ["Branches", data.meta.branches.join(", ")],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Sheet 2: Segments
  if (data.segments && data.segments.length > 0) {
    const segmentData = [
      ["Segment", "Revenue", "% of Total", "YoY Growth %"],
    ];
    data.segments.forEach((seg) => {
      segmentData.push([
        seg.name,
        `$${seg.revenue.toLocaleString()}`,
        `${seg.sharePct.toFixed(1)}%`,
        seg.yoyPct !== null ? `${seg.yoyPct.toFixed(1)}%` : "N/A",
      ]);
    });
    const segmentSheet = XLSX.utils.aoa_to_sheet(segmentData);
    XLSX.utils.book_append_sheet(workbook, segmentSheet, "Segments");
  }

  // Sheet 3: Top Customers by Revenue
  if (data.topCustomersByRevenue && data.topCustomersByRevenue.length > 0) {
    const customerData = [["Rank", "Customer", "Revenue"]];
    data.topCustomersByRevenue.forEach((cust, idx) => {
      customerData.push([
        (idx + 1).toString(),
        cust.customer,
        `$${cust.revenue.toLocaleString()}`,
      ]);
    });
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, "Top Customers");
  }

  // Sheet 4: Revenue by FY
  if (data.revenueByFy && data.revenueByFy.length > 0) {
    const fyData = [["Financial Year", "Revenue", "YoY Growth %"]];
    data.revenueByFy.forEach((fy) => {
      fyData.push([
        fy.fy,
        `$${fy.revenue.toLocaleString()}`,
        fy.yoyGrowthPct !== null ? `${fy.yoyGrowthPct.toFixed(1)}%` : "N/A",
      ]);
    });
    const fySheet = XLSX.utils.aoa_to_sheet(fyData);
    XLSX.utils.book_append_sheet(workbook, fySheet, "Revenue by FY");
  }

  // Sheet 5: Concentration Risk
  if (data.concentration) {
    // Determine risk level based on thresholds
    let riskLevel = "LOW";
    const { top1CustomerPct, top5Pct } = data.concentration;
    
    if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_CRITICAL || top5Pct > CONCENTRATION_THRESHOLDS.TOP5_CRITICAL) {
      riskLevel = "CRITICAL";
    } else if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_HIGH_RISK || top5Pct > CONCENTRATION_THRESHOLDS.TOP5_HIGH_RISK) {
      riskLevel = "HIGH";
    } else if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_MODERATE || top5Pct > CONCENTRATION_THRESHOLDS.TOP5_MODERATE) {
      riskLevel = "MEDIUM";
    } else if (top5Pct > CONCENTRATION_THRESHOLDS.TOP5_MONITORING) {
      riskLevel = "MONITOR";
    }

    const concData = [
      ["Concentration Risk Analysis"],
      [],
      ["Top 5 Customers %", `${top5Pct.toFixed(1)}%`],
      ["Top 1 Customer %", `${top1CustomerPct.toFixed(1)}%`],
      ["Risk Level", riskLevel],
    ];
    const concSheet = XLSX.utils.aoa_to_sheet(concData);
    XLSX.utils.book_append_sheet(workbook, concSheet, "Concentration Risk");
  }

  // Sheet 6: Customer Trends
  if (data.customerTrends) {
    const trendData = [["Customer Trend Analysis"], []];
    
    if (data.customerTrends.rising && data.customerTrends.rising.length > 0) {
      trendData.push(["Rising Revenue Customers"]);
      trendData.push(["Customer", "Prior Year", "Current Year", "Change %"]);
      data.customerTrends.rising.forEach((cust) => {
        trendData.push([
          cust.customer,
          `$${cust.priorYearRevenue.toLocaleString()}`,
          `$${cust.currentYearRevenue.toLocaleString()}`,
          `${cust.changePct.toFixed(1)}%`,
        ]);
      });
      trendData.push([]);
    }
    
    if (data.customerTrends.dropping && data.customerTrends.dropping.length > 0) {
      trendData.push(["Declining Revenue Customers"]);
      trendData.push(["Customer", "Prior Year", "Current Year", "Change %"]);
      data.customerTrends.dropping.forEach((cust) => {
        trendData.push([
          cust.customer,
          `$${cust.priorYearRevenue.toLocaleString()}`,
          `$${cust.currentYearRevenue.toLocaleString()}`,
          `${cust.changePct.toFixed(1)}%`,
        ]);
      });
      trendData.push([]);
    }
    
    trendData.push(["Churn Count", data.customerTrends.churnCount.toString()]);
    trendData.push(["New Customer Count", data.customerTrends.acquisitionCount.toString()]);
    
    const trendSheet = XLSX.utils.aoa_to_sheet(trendData);
    XLSX.utils.book_append_sheet(workbook, trendSheet, "Customer Trends");
  }

  // Sheet 7: Expansion Opportunities
  if (data.expansion && data.expansion.length > 0) {
    const expData = [["Segment", "% of Primary", "YoY Growth %", "Decision"]];
    data.expansion.forEach((exp) => {
      expData.push([
        exp.segment,
        `${exp.pctOfPrimary.toFixed(1)}%`,
        exp.yoyPct !== null ? `${exp.yoyPct.toFixed(1)}%` : "N/A",
        exp.decision,
      ]);
    });
    const expSheet = XLSX.utils.aoa_to_sheet(expData);
    XLSX.utils.book_append_sheet(workbook, expSheet, "Expansion");
  }

  // Sheet 8: Seasonality
  if (data.seasonality && data.seasonality.length > 0) {
    const totalSeasonalRevenue = data.seasonality.reduce((sum, s) => sum + s.revenue, 0);
    const seasonData = [["Period", "Revenue", "% of Total"]];
    data.seasonality.forEach((season) => {
      const pct = totalSeasonalRevenue > 0 ? (season.revenue / totalSeasonalRevenue) * 100 : 0;
      seasonData.push([
        season.period,
        `$${season.revenue.toLocaleString()}`,
        `${pct.toFixed(1)}%`,
      ]);
    });
    const seasonSheet = XLSX.utils.aoa_to_sheet(seasonData);
    XLSX.utils.book_append_sheet(workbook, seasonSheet, "Seasonality");
  }

  // Sheet 9: Cash Flow
  if (data.cash) {
    const cashData = [
      ["Cash Flow Analysis"],
      [],
      ["Total Billed", `$${data.cash.totalBilled.toLocaleString()}`],
      ["Total Outstanding", `$${data.cash.totalOutstanding.toLocaleString()}`],
      ["Stuck %", `${data.cash.stuckPct.toFixed(1)}%`],
    ];
    const cashSheet = XLSX.utils.aoa_to_sheet(cashData);
    XLSX.utils.book_append_sheet(workbook, cashSheet, "Cash Flow");
  }

  // Sheet 10: Weekly Trends (sample - first 100 rows)
  if (data.weeklyTrend && data.weeklyTrend.length > 0) {
    const weeklyData = [["FY", "FY Week", "Branch", "Revenue"]];
    data.weeklyTrend.slice(0, 100).forEach((week) => {
      weeklyData.push([
        week.fy,
        week.fyWeek.toString(),
        week.branch,
        `$${week.revenue.toLocaleString()}`,
      ]);
    });
    const weeklySheet = XLSX.utils.aoa_to_sheet(weeklyData);
    XLSX.utils.book_append_sheet(workbook, weeklySheet, "Weekly Trends (Sample)");
  }

  // Generate file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sales-analysis-${new Date().toISOString().split("T")[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
