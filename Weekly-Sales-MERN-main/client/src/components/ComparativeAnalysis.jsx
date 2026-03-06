import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import Plot from 'react-plotly.js';
import { GitCompare, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import './ComparativeAnalysis.css';

function ComparativeAnalysis({ historicalData }) {
  const [showDetailedTable, setShowDetailedTable] = useState(false);

  // Get available financial years
  const yearOptions = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    const years = [...new Set(historicalData.map(r => r.FinancialYear))].sort();
    return years.map(y => ({ value: y, label: y }));
  }, [historicalData]);

  // Auto-select last 2 years by default
  const [firstYear, setFirstYear] = useState(null);
  const [secondYear, setSecondYear] = useState(null);

  // Auto-select the last two years when data loads
  React.useEffect(() => {
    if (yearOptions.length >= 2 && !firstYear && !secondYear) {
      setFirstYear(yearOptions[yearOptions.length - 2]);
      setSecondYear(yearOptions[yearOptions.length - 1]);
    }
  }, [yearOptions, firstYear, secondYear]);

  // Calculate totals for each year
  const yearTotals = useMemo(() => {
    if (!historicalData || !firstYear || !secondYear) return { first: 0, second: 0, change: 0, changePercent: 0 };

    const firstTotal = historicalData
      .filter(r => r.FinancialYear === firstYear.value)
      .reduce((sum, r) => sum + (parseFloat(r.Total) || 0), 0);

    const secondTotal = historicalData
      .filter(r => r.FinancialYear === secondYear.value)
      .reduce((sum, r) => sum + (parseFloat(r.Total) || 0), 0);

    const change = secondTotal - firstTotal;
    const changePercent = firstTotal > 0 ? (change / firstTotal) * 100 : 0;

    return { first: firstTotal, second: secondTotal, change, changePercent };
  }, [historicalData, firstYear, secondYear]);

  // Week-by-week comparison data
  const weekByWeekData = useMemo(() => {
    if (!historicalData || !firstYear || !secondYear) return { chart: [], table: [] };

    const firstYearData = {};
    const secondYearData = {};

    historicalData.forEach(row => {
      const week = parseInt(row.Week);
      const total = parseFloat(row.Total) || 0;

      if (row.FinancialYear === firstYear.value) {
        firstYearData[week] = (firstYearData[week] || 0) + total;
      } else if (row.FinancialYear === secondYear.value) {
        secondYearData[week] = (secondYearData[week] || 0) + total;
      }
    });

    // Generate chart data
    const weeks = [];
    for (let i = 1; i <= 52; i++) {
      weeks.push(i);
    }

    const chartData = [
      {
        x: weeks,
        y: weeks.map(w => firstYearData[w] || 0),
        name: firstYear.value,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#2563eb', width: 2 },
        marker: { size: 5 }
      },
      {
        x: weeks,
        y: weeks.map(w => secondYearData[w] || 0),
        name: secondYear.value,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#6366f1', width: 2 },
        marker: { size: 5 }
      }
    ];

    // Generate table data
    const tableData = weeks.map(week => {
      const firstVal = firstYearData[week] || 0;
      const secondVal = secondYearData[week] || 0;
      const diff = secondVal - firstVal;
      const changePercent = firstVal > 0 ? (diff / firstVal) * 100 : 0;

      return {
        week,
        firstYear: firstVal,
        secondYear: secondVal,
        difference: diff,
        changePercent
      };
    });

    return { chart: chartData, table: tableData };
  }, [historicalData, firstYear, secondYear]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="comparative-analysis">
        <h2 className="section-title"><GitCompare size={22} /> Comparative Analysis</h2>
        <p className="no-data-message">No historical data available.</p>
      </div>
    );
  }

  return (
    <div className="comparative-analysis">
      <h2 className="section-title"><GitCompare size={22} /> Comparative Analysis</h2>

      {/* Year Selectors */}
      <div className="year-selector-section">
        <div className="year-selector-group">
          <label>Select First Year</label>
          <Select
            options={yearOptions}
            value={firstYear}
            onChange={setFirstYear}
            placeholder="Choose first year..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="year-selector-group">
          <label>Select Second Year</label>
          <Select
            options={yearOptions}
            value={secondYear}
            onChange={setSecondYear}
            placeholder="Choose second year..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      {/* Metric Cards */}
      {firstYear && secondYear && (
        <>
          <div className="comparison-metrics">
            <div className="metric-card">
              <div className="metric-label">{firstYear.label} Total</div>
              <div className="metric-value">{formatCurrency(yearTotals.first)}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">{secondYear.label} Total</div>
              <div className="metric-value">{formatCurrency(yearTotals.second)}</div>
            </div>

            <div className={`metric-card ${yearTotals.change >= 0 ? 'positive' : 'negative'}`}>
              <div className="metric-label">Change</div>
              <div className="metric-value">{formatCurrency(yearTotals.change)}</div>
              <div className="metric-percent">{formatPercent(yearTotals.changePercent)}</div>
            </div>
          </div>

          {/* Week-by-Week Comparison Chart */}
          <div className="comparison-chart-section">
            <h3 className="subsection-title">
              <TrendingUp size={18} /> Week-by-Week Comparison: {firstYear.label} vs {secondYear.label}
            </h3>
            <div className="chart-subtitle">Sales Comparison: {firstYear.label} vs {secondYear.label}</div>
            <Plot
              data={weekByWeekData.chart}
              layout={{
                font: { family: 'Inter, sans-serif', color: '#64748b' },
                xaxis: {
                  title: 'Week',
                  showgrid: true,
                  gridcolor: '#f1f5f9',
                  zeroline: false,
                  tickfont: { color: '#94a3b8' },
                  dtick: 5
                },
                yaxis: {
                  title: 'Total Sales',
                  showgrid: true,
                  gridcolor: '#e2e8f0',
                  zeroline: false,
                  tickfont: { color: '#94a3b8' }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                margin: { l: 60, r: 20, t: 30, b: 50 },
                legend: {
                  orientation: 'h',
                  x: 0.5,
                  y: 1.15,
                  xanchor: 'center',
                  font: { color: '#475569', size: 11 }
                },
                hovermode: 'closest',
                hoverlabel: {
                  bgcolor: '#1e293b',
                  font: { color: 'white', family: 'Inter, sans-serif' },
                  bordercolor: 'transparent'
                }
              }}
              config={{
                responsive: true,
                displayModeBar: false
              }}
              style={{ width: '100%', height: '400px' }}
            />
          </div>

          {/* Detailed Comparison Table */}
          <div className="detailed-table-section">
            <div
              className="table-toggle"
              onClick={() => setShowDetailedTable(!showDetailedTable)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, color: 'var(--blue-primary)' }}
            >
              {showDetailedTable ? <ChevronDown size={18} /> : <ChevronRight size={18} />} 
              <span>View Detailed Comparison Table</span>
            </div>

            {showDetailedTable && (
              <div className="table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Branch</th>
                      <th>{firstYear.label}</th>
                      <th>{secondYear.label}</th>
                      <th>Difference</th>
                      <th>% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekByWeekData.table.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.week}</td>
                        <td>All</td>
                        <td>{formatCurrency(row.firstYear)}</td>
                        <td>{formatCurrency(row.secondYear)}</td>
                        <td className={row.difference >= 0 ? 'positive-change' : 'negative-change'}>
                          {formatCurrency(row.difference)}
                        </td>
                        <td className={row.changePercent >= 0 ? 'positive-change' : 'negative-change'}>
                          {formatPercent(row.changePercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ComparativeAnalysis;
