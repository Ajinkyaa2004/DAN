const express = require('express');
const {
  filterByBranch,
  filterByCustomer,
  filterByYearRange,
  filterByDateRange,
  filterHistoricalByBranch,
  filterHistoricalByYear,
  filterByQuarter,
  filterByWeeks,
} = require('../utils/dataFilters');
const {
  groupByMonthAndBranch,
  getCustomerYearPivot,
  getCustomerPurchases,
  groupByCustomerAndYear,
  groupByCustomerAndMonth,
  aggregateByWeek,
  groupByFinancialYearAndBranch,
} = require('../utils/analysisUtils');

const router = express.Router();

// Helper to safely extract array from body
function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// POST /api/analyze/monthly
// Body: { data, branches, yearRange: [min,max], dateRange: [start,end] }
router.post('/analyze/monthly', (req, res) => {
  try {
    const { data = [], branches = [], yearRange = [], dateRange = [] } = req.body || {};

    let filtered = filterByBranch(data, asArray(branches));
    if (yearRange.length === 2) {
      filtered = filterByYearRange(filtered, yearRange[0], yearRange[1]);
    }
    if (dateRange.length === 2) {
      filtered = filterByDateRange(filtered, dateRange[0], dateRange[1]);
    }

    const monthly = groupByMonthAndBranch(filtered);
    return res.json({ monthly });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/analyze/monthly:', err);
    return res.status(500).json({ error: 'Failed to analyze monthly sales.' });
  }
});

// POST /api/analyze/customers
// Body: { data, branches }
router.post('/analyze/customers', (req, res) => {
  try {
    const { data = [], branches = [] } = req.body || {};
    const filtered = filterByBranch(data, asArray(branches));
    const { pivot, years } = getCustomerYearPivot(filtered);

    const dropping = [];
    const rising = [];

    if (years.length >= 2) {
      const lastYear = years[years.length - 1];
      const prevYear = years[years.length - 2];

      Object.keys(pivot).forEach((cust) => {
        const info = pivot[cust];
        if (info.Drop) {
          dropping.push({ Customer: cust, [prevYear]: info[prevYear] || 0, [lastYear]: info[lastYear] || 0 });
        }
        if (info.Rise) {
          rising.push({ Customer: cust, [prevYear]: info[prevYear] || 0, [lastYear]: info[lastYear] || 0 });
        }
      });
    }

    return res.json({ pivot, years, dropping, rising });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/analyze/customers:', err);
    return res.status(500).json({ error: 'Failed to analyze customer trends.' });
  }
});

// POST /api/analyze/customer-detail
// Body: { data, branches, customers, dateRange: [start,end] }
router.post('/analyze/customer-detail', (req, res) => {
  try {
    const { data = [], branches = [], customers = [], dateRange = [] } = req.body || {};

    let filtered = filterByBranch(data, asArray(branches));
    const customerList = asArray(customers);
    const start = dateRange[0];
    const end = dateRange[1];

    const purchases = getCustomerPurchases(filtered, customerList, start, end);

    // Total purchase for filtered records
    const totalPurchase = purchases.reduce((sum, row) => sum + (row.Total || 0), 0);

    // Derive Month from IssueDate for monthly grouping (like app.py)
    const purchasesWithMonth = purchases.map((row) => {
      const d = row.IssueDate ? new Date(row.IssueDate) : null;
      let Month = row.Month;
      if (d && !Number.isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        Month = `${year}-${month}`;
      }
      return { ...row, Month };
    });

    const yearly = groupByCustomerAndYear(purchasesWithMonth);
    const monthly = groupByCustomerAndMonth(purchasesWithMonth);

    return res.json({
      purchases,
      totalPurchase,
      yearly,
      monthly,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/analyze/customer-detail:', err);
    return res.status(500).json({ error: 'Failed to analyze customer purchase details.' });
  }
});

// POST /api/analyze/historical
// Body: { data, branches, financialYears, quarters, weeks }
router.post('/analyze/historical', (req, res) => {
  try {
    const {
      data = [],
      branches = [],
      financialYears = [],
      quarters = [],
      weeks = [],
    } = req.body || {};

    let filtered = filterHistoricalByBranch(data, asArray(branches));
    filtered = filterHistoricalByYear(filtered, asArray(financialYears));

    let quarterWeekFiltered = filtered;

    if (Array.isArray(weeks) && weeks.length > 0) {
      // Specific week selection overrides quarters
      quarterWeekFiltered = filterByWeeks(filtered, weeks);
    } else if (Array.isArray(quarters) && quarters.length > 0 && !quarters.includes('All Quarters')) {
      quarterWeekFiltered = filterByQuarter(filtered, quarters);
    }

    const aggregatedByWeek = aggregateByWeek(quarterWeekFiltered);
    const totalSales = aggregatedByWeek.reduce((sum, row) => sum + (row.Total || 0), 0);
    const annualTotals = groupByFinancialYearAndBranch(filtered);

    return res.json({
      quarterWeekRows: quarterWeekFiltered,
      aggregatedByWeek,
      totalSales,
      annualTotals,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/analyze/historical:', err);
    return res.status(500).json({ error: 'Failed to analyze historical data.' });
  }
});

module.exports = router;

