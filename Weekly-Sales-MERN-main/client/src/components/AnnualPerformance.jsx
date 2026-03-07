import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BarChart3 } from 'lucide-react';
import './AnnualPerformance.css';

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

function AnnualPerformance({ historicalData, selectedBranches = [] }) {
  // Determine displayed branches
  const displayBranches = useMemo(() => {
    if (selectedBranches && selectedBranches.length > 0) {
      return selectedBranches;
    }
    // Fallback: extract unique branches from data if nothing explicitly selected
    const branches = new Set();
    if (historicalData) {
      historicalData.forEach(row => {
         if (row.Branch && row.Branch.toUpperCase() !== 'UNKNOWN') {
             branches.add(row.Branch);
         }
      });
    }
    return Array.from(branches).sort();
  }, [selectedBranches, historicalData]);

  const tableData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    // Group data by Financial Year and Branch
    const yearBranchMap = {};
    
    historicalData.forEach(row => {
      const year = row.FinancialYear;
      const branch = row.Branch;
      const total = parseFloat(row.Total) || 0;

      if (!yearBranchMap[year]) {
        yearBranchMap[year] = {};
        displayBranches.forEach(b => yearBranchMap[year][b] = 0);
      }

      if (displayBranches.includes(branch) && yearBranchMap[year][branch] !== undefined) {
        yearBranchMap[year][branch] += total;
      }
    });

    // Convert to array and sort by year
    const data = Object.keys(yearBranchMap)
      .sort()
      .map(year => {
        const yearItem = { year };
        let total = 0;
        displayBranches.forEach(b => {
           yearItem[b] = yearBranchMap[year][b];
           total += yearBranchMap[year][b];
        });
        yearItem.total = total;
        return yearItem;
      });

    return data;
  }, [historicalData, displayBranches]);

  const chartData = useMemo(() => {
    if (tableData.length === 0) return [];

    const years = tableData.map(d => d.year);
    
    // Define a color map for known branches
    const colorMap = {
       'WA': '#3b82f6',
       'NSW': '#8b5cf6',
       'QLD': '#f59e0b'
    };
    const defaultColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#ec4899'];

    return displayBranches.map((branch, index) => {
      const bData = tableData.map(d => d[branch] || 0);
      const textData = bData.map(val => formatShortCurrency(val));
      const color = colorMap[branch] || defaultColors[index % defaultColors.length];
      return {
        x: years,
        y: bData,
        text: textData,
        textposition: 'outside',
        textfont: { size: 10, color: '#64748b' },
        name: branch,
        type: 'bar',
        marker: { color, line: { width: 0 } }
      };
    });
  }, [tableData, displayBranches]);



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
                {displayBranches.map(branch => (
                  <th key={branch} className="amount-header">{branch}</th>
                ))}
                <th className="total-header">Total</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={row.year}>
                  <td>{index + 1}</td>
                  <td className="year-cell">{row.year}</td>
                  {displayBranches.map(branch => (
                     <td key={branch} className="amount-cell">{formatShortCurrency(row[branch])}</td>
                  ))}
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
