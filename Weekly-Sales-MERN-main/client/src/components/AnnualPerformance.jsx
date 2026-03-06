import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BarChart3 } from 'lucide-react';
import './AnnualPerformance.css';

function AnnualPerformance({ historicalData }) {
  const tableData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    // Group data by Financial Year and Branch
    const yearBranchMap = {};
    
    historicalData.forEach(row => {
      const year = row.FinancialYear;
      const branch = row.Branch;
      const total = parseFloat(row.Total) || 0;

      if (!yearBranchMap[year]) {
        yearBranchMap[year] = { NSW: 0, QLD: 0, WA: 0 };
      }

      if (yearBranchMap[year][branch] !== undefined) {
        yearBranchMap[year][branch] += total;
      }
    });

    // Convert to array and sort by year
    const data = Object.keys(yearBranchMap)
      .sort()
      .map(year => ({
        year,
        NSW: yearBranchMap[year].NSW,
        QLD: yearBranchMap[year].QLD,
        WA: yearBranchMap[year].WA,
        total: yearBranchMap[year].NSW + yearBranchMap[year].QLD + yearBranchMap[year].WA
      }));

    return data;
  }, [historicalData]);

  const chartData = useMemo(() => {
    if (tableData.length === 0) return [];

    const years = tableData.map(d => d.year);
    const waData = tableData.map(d => d.WA);
    const nswData = tableData.map(d => d.NSW);
    const qldData = tableData.map(d => d.QLD);

    return [
      {
        x: years,
        y: waData,
        name: 'WA',
        type: 'bar',
        marker: { color: '#6366f1', line: { width: 0 } }
      },
      {
        x: years,
        y: nswData,
        name: 'NSW',
        type: 'bar',
        marker: { color: '#2563eb', line: { width: 0 } }
      },
      {
        x: years,
        y: qldData,
        name: 'QLD',
        type: 'bar',
        marker: { color: '#0ea5e9', line: { width: 0 } }
      }
    ];
  }, [tableData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatShortCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return formatCurrency(value);
  };

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="annual-performance">
        <h2 className="section-title"><BarChart3 size={22} />Annual Sales Overview</h2>
        <p className="no-data-message">No historical data available. Please upload historical Excel data.</p>
      </div>
    );
  }

  return (
    <div className="annual-performance">
      <h2 className="section-title"><BarChart3 size={22} />Annual Sales Overview</h2>

      {/* Annual Performance Table */}
      <div className="performance-table-container">
        <h3 className="subsection-title">Annual Performance</h3>
        <div className="table-wrapper">
          <table className="performance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Financial Year</th>
                <th>NSW</th>
                <th>QLD</th>
                <th>WA</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={row.year}>
                  <td>{index + 1}</td>
                  <td className="year-cell">{row.year}</td>
                  <td className="amount-cell">{formatShortCurrency(row.NSW)}</td>
                  <td className="amount-cell">{formatShortCurrency(row.QLD)}</td>
                  <td className="amount-cell">{formatShortCurrency(row.WA)}</td>
                  <td className="total-cell">{formatShortCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="performance-chart-container">
        <h3 className="subsection-title">Total Sales per Financial Year</h3>
        <Plot
          data={chartData}
          layout={{
            barmode: 'group',
            font: { family: 'Inter, sans-serif', color: '#64748b' },
            xaxis: {
              showgrid: false,
              zeroline: false,
              tickfont: { color: '#94a3b8' }
            },
            yaxis: {
              showgrid: true,
              gridcolor: '#e2e8f0',
              gridwidth: 1,
              zeroline: false,
              tickfont: { color: '#94a3b8' }
            },
            legend: {
              orientation: 'h',
              x: 0.5,
              xanchor: 'center',
              y: 1.15,
              font: { color: '#475569', size: 11 }
            },
            hovermode: 'x unified',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 40, r: 20, t: 30, b: 40 },
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
          style={{ width: '100%', height: '360px' }}
        />
      </div>
    </div>
  );
}

export default AnnualPerformance;
