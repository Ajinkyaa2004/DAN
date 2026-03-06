function filterByBranch(data, branches) {
  if (!Array.isArray(data) || !Array.isArray(branches) || branches.length === 0) return data || [];
  const set = new Set(branches);
  return data.filter((row) => row.Branch && set.has(row.Branch));
}

function filterByCustomer(data, customers) {
  if (!Array.isArray(data) || !Array.isArray(customers) || customers.length === 0) return data || [];
  const set = new Set(customers);
  return data.filter((row) => row.Customer && set.has(row.Customer));
}

function filterByYearRange(data, minYear, maxYear) {
  if (!Array.isArray(data) || minYear == null || maxYear == null) return data || [];
  return data.filter((row) => row.Year >= minYear && row.Year <= maxYear);
}

function filterByDateRange(data, startDate, endDate) {
  if (!Array.isArray(data) || !startDate || !endDate) return data || [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  return data.filter((row) => {
    const d = row.IssueDate ? new Date(row.IssueDate) : null;
    return d && d >= start && d <= end;
  });
}

function filterHistoricalByBranch(data, branches) {
  return filterByBranch(data, branches);
}

function filterHistoricalByYear(data, financialYears) {
  if (!Array.isArray(data) || !Array.isArray(financialYears) || financialYears.length === 0) {
    return data || [];
  }
  const set = new Set(financialYears);
  return data.filter((row) => row.FinancialYear && set.has(row.FinancialYear));
}

// Quarter mapping: same as in app.py
const QUARTER_MAP = {
  'Q1 (Weeks 1-13)': [1, 13],
  'Q2 (Weeks 14-26)': [14, 26],
  'Q3 (Weeks 27-39)': [27, 39],
  'Q4 (Weeks 40-52)': [40, 52],
};

function filterByQuarter(data, quarters) {
  if (!Array.isArray(data) || !Array.isArray(quarters) || quarters.length === 0) return data || [];
  const weeks = new Set();

  quarters.forEach((q) => {
    const range = QUARTER_MAP[q];
    if (range) {
      const [start, end] = range;
      for (let w = start; w <= end; w += 1) {
        weeks.add(w);
      }
    }
  });

  if (weeks.size === 0) return data || [];

  return data.filter((row) => typeof row.Week === 'number' && weeks.has(row.Week));
}

function filterByWeeks(data, weeks) {
  if (!Array.isArray(data) || !Array.isArray(weeks) || weeks.length === 0) return data || [];
  const set = new Set(weeks);
  return data.filter((row) => typeof row.Week === 'number' && set.has(row.Week));
}

module.exports = {
  filterByBranch,
  filterByCustomer,
  filterByYearRange,
  filterByDateRange,
  filterHistoricalByBranch,
  filterHistoricalByYear,
  filterByQuarter,
  filterByWeeks,
  QUARTER_MAP,
};

