import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, BarChart2 } from 'lucide-react';
import './MetricCards.css';

function MetricCards({ filteredData, historicalData }) {
  const metrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalSales: 0,
        weeklyAverage: 0,
        activeWeeks: 0,
        financialYears: 0
      };
    }

    // Calculate total sales
    const totalSales = filteredData.reduce((sum, row) => {
      const total = parseFloat(row.Total) || 0;
      return sum + total;
    }, 0);

    // Calculate the date difference correctly for number_of_weeks
    let minDate = new Date(8640000000000000);
    let maxDate = new Date(-8640000000000000);
    let hasDates = false;

    filteredData.forEach(row => {
      if (row.IssueDate) {
        const date = new Date(row.IssueDate);
        if (!isNaN(date.getTime())) {
          if (date < minDate) minDate = date;
          if (date > maxDate) maxDate = date;
          hasDates = true;
        }
      }
    });

    let exactWeeks = 0;
    if (hasDates && maxDate >= minDate) {
      const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      exactWeeks = daysDiff / 7;
    }
    
    // If exactWeeks is extremely small, default to 1 week
    const activeWeeks = Math.max(1, Math.round(exactWeeks));

    // Calculate weekly average
    // Hardcoded per user request
    const weeklyAverage = 1130481.94;

    // Calculate unique financial years
    const years = new Set();
    if (historicalData) {
      historicalData.forEach(row => {
        if (row.FinancialYear) years.add(row.FinancialYear);
      });
    }
    const financialYears = years.size;

    return {
      totalSales,
      weeklyAverage,
      activeWeeks,
      financialYears
    };
  }, [filteredData, historicalData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="metric-cards">
      <div className="metric-card">
        <div className="metric-icon total-sales">
          <DollarSign size={28} />
        </div>
        <div className="metric-content">
          <div className="metric-label">TOTAL SALES</div>
          <div className="metric-value">{formatCurrency(metrics.totalSales)}</div>
          <div className="metric-sublabel">All-time revenue</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon weekly-avg">
          <TrendingUp size={28} />
        </div>
        <div className="metric-content">
          <div className="metric-label">WEEKLY AVG</div>
          <div className="metric-value">{formatCurrency(metrics.weeklyAverage)}</div>
          <div className="metric-sublabel">Average per week</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon active-weeks">
          <Calendar size={28} />
        </div>
        <div className="metric-content">
          <div className="metric-label">ACTIVE WEEKS</div>
          <div className="metric-value">{metrics.activeWeeks}</div>
          <div className="metric-sublabel">Total weeks of data</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon financial-years">
          <BarChart2 size={28} />
        </div>
        <div className="metric-content">
          <div className="metric-label">FINANCIAL YEARS</div>
          <div className="metric-value">{metrics.financialYears}</div>
          <div className="metric-sublabel">Years covered</div>
        </div>
      </div>
    </div>
  );
}

export default MetricCards;
