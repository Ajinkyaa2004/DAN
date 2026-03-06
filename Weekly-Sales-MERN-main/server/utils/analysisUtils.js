function groupByMonthAndBranch(data) {
  if (!Array.isArray(data)) return [];
  const map = new Map();

  data.forEach((row) => {
    const key = `${row.Month}||${row.Branch}`;
    const prev = map.get(key) || 0;
    map.set(key, prev + (row.Total || 0));
  });

  return Array.from(map.entries()).map(([key, total]) => {
    const [Month, Branch] = key.split('||');
    return { Month, Branch, Total: total };
  });
}

function getCustomerYearPivot(data) {
  if (!Array.isArray(data)) return { pivot: {}, years: [] };
  const pivot = {};
  const yearsSet = new Set();

  data.forEach((row) => {
    if (!row.Customer || row.Year == null) return;
    const year = row.Year;
    yearsSet.add(year);
    if (!pivot[row.Customer]) {
      pivot[row.Customer] = {};
    }
    const prev = pivot[row.Customer][year] || 0;
    pivot[row.Customer][year] = prev + (row.Total || 0);
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  if (years.length >= 2) {
    const lastYear = years[years.length - 1];
    const prevYear = years[years.length - 2];

    Object.keys(pivot).forEach((cust) => {
      const lastTotal = pivot[cust][lastYear] || 0;
      const prevTotal = pivot[cust][prevYear] || 0;
      pivot[cust].Drop = lastTotal < prevTotal;
      pivot[cust].Rise = lastTotal > prevTotal;
    });
  }

  return { pivot, years };
}

function getCustomerPurchases(data, customers, startDate, endDate) {
  if (!Array.isArray(data)) return [];
  const set = new Set(customers || []);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  return data.filter((row) => {
    if (!row.Customer || !set.has(row.Customer)) return false;
    if (!row.IssueDate) return false;
    const d = new Date(row.IssueDate);
    if (Number.isNaN(d.getTime())) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

function groupByCustomerAndYear(data) {
  if (!Array.isArray(data)) return [];
  const map = new Map();

  data.forEach((row) => {
    if (!row.Customer || row.Year == null) return;
    const key = `${row.Customer}||${row.Year}`;
    const prev = map.get(key) || 0;
    map.set(key, prev + (row.Total || 0));
  });

  return Array.from(map.entries()).map(([key, total]) => {
    const [Customer, YearStr] = key.split('||');
    return { Customer, Year: Number.parseInt(YearStr, 10), Total: total };
  });
}

function groupByCustomerAndMonth(data) {
  if (!Array.isArray(data)) return [];
  const map = new Map();

  data.forEach((row) => {
    if (!row.Customer || !row.Month) return;
    const key = `${row.Customer}||${row.Month}`;
    const prev = map.get(key) || 0;
    map.set(key, prev + (row.Total || 0));
  });

  return Array.from(map.entries()).map(([key, total]) => {
    const [Customer, Month] = key.split('||');
    return { Customer, Month, Total: total };
  });
}

function aggregateByWeek(historicalData) {
  if (!Array.isArray(historicalData)) return [];
  const map = new Map();

  historicalData.forEach((row) => {
    const key = `${row.Branch}||${row.FinancialYear}||${row.Week}`;
    const prev = map.get(key) || 0;
    map.set(key, prev + (row.Total || 0));
  });

  return Array.from(map.entries()).map(([key, total]) => {
    const [Branch, FinancialYear, WeekStr] = key.split('||');
    return { Branch, FinancialYear, Week: Number.parseInt(WeekStr, 10), Total: total };
  });
}

function groupByFinancialYearAndBranch(historicalData) {
  if (!Array.isArray(historicalData)) return [];
  const map = new Map();

  historicalData.forEach((row) => {
    const key = `${row.FinancialYear}||${row.Branch}`;
    const prev = map.get(key) || 0;
    map.set(key, prev + (row.Total || 0));
  });

  return Array.from(map.entries()).map(([key, total]) => {
    const [FinancialYear, Branch] = key.split('||');
    return { FinancialYear, Branch, Total: total };
  });
}

module.exports = {
  groupByMonthAndBranch,
  getCustomerYearPivot,
  getCustomerPurchases,
  groupByCustomerAndYear,
  groupByCustomerAndMonth,
  aggregateByWeek,
  groupByFinancialYearAndBranch,
};

