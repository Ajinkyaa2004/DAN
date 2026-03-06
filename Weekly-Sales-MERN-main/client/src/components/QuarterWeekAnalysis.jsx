import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import Plot from 'react-plotly.js';
import { Calendar, FileText, TrendingUp } from 'lucide-react';
import './QuarterWeekAnalysis.css';

function QuarterWeekAnalysis({ historicalData }) {
  const [selectedQuarters, setSelectedQuarters] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);

  // Get all unique quarters and weeks
  const { quarterOptions, weekOptions } = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return { quarterOptions: [], weekOptions: [] };
    }

    const quarters = [...new Set(historicalData.map(r => r.Quarter))].sort();
    const weeks = [...new Set(historicalData.map(r => r.Week))].filter(w => w).sort((a, b) => a - b);

    return {
      quarterOptions: quarters.map(q => ({ value: q, label: q })),
      weekOptions: weeks.map(w => ({ value: w, label: `Week ${w}` }))
    };
  }, [historicalData]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    let data = historicalData;

    // Filter by quarters if selected
    if (selectedQuarters.length > 0) {
      const selectedQs = selectedQuarters.map(q => q.value);
      data = data.filter(row => selectedQs.includes(row.Quarter));
    }

    // Filter by weeks if selected
    if (selectedWeeks.length > 0) {
      const selectedWs = selectedWeeks.map(w => w.value);
      data = data.filter(row => selectedWs.includes(row.Week));
    }

    return data;
  }, [historicalData, selectedQuarters, selectedWeeks]);

  // Calculate detailed sales table
  const detailedTable = useMemo(() => {
    if (filteredData.length === 0) return [];

    // Group by Branch, Financial Year, and Week
    const groupedData = {};

    filteredData.forEach(row => {
      const key = `${row.Branch}-${row.FinancialYear}-${row.Week}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          branch: row.Branch,
          financialYear: row.FinancialYear,
          week: row.Week,
          total: 0
        };
      }
      groupedData[key].total += parseFloat(row.Total) || 0;
    });

    return Object.values(groupedData).sort((a, b) => {
      if (a.branch !== b.branch) return a.branch.localeCompare(b.branch);
      if (a.financialYear !== b.financialYear) return a.financialYear.localeCompare(b.financialYear);
      return a.week - b.week;
    });
  }, [filteredData]);

  // Calculate total sales
  const totalSales = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + (parseFloat(row.Total) || 0), 0);
  }, [filteredData]);

  // Prepare chart data - Weekly trend by branch
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];

    const branches = [...new Set(filteredData.map(r => r.Branch))].sort();
    const colors = {
      'WA': '#5e35b1',
      'NSW': '#1e88e5',
      'QLD': '#00acc1'
    };

    return branches.map(branch => {
      const branchData = filteredData.filter(r => r.Branch === branch);
      
      // Group by week
      const weekMap = {};
      branchData.forEach(row => {
        const week = row.Week;
        if (!weekMap[week]) {
          weekMap[week] = 0;
        }
        weekMap[week] += parseFloat(row.Total) || 0;
      });

      const weeks = Object.keys(weekMap).map(Number).sort((a, b) => a - b);
      const sales = weeks.map(w => weekMap[w]);

      return {
        x: weeks,
        y: sales,
        name: branch,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: colors[branch] || '#999', width: 2 },
        marker: { size: 6 }
      };
    });
  }, [filteredData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="quarter-week-analysis">
        <h2 className="section-title"><Calendar size={22} />Quarter / Week Range Analysis</h2>
        <p className="no-data-message">No historical data available.</p>
      </div>
    );
  }

  return (
    <div className="quarter-week-analysis">
      <h2 className="section-title"><Calendar size={22} />Quarter / Week Range Analysis</h2>

      {/* Selectors */}
      <div className="selector-row">
        <div className="selector-group">
          <label>Select Quarter(s)</label>
          <Select
            isMulti
            options={quarterOptions}
            value={selectedQuarters}
            onChange={setSelectedQuarters}
            placeholder="All Quarters"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="selector-group">
          <label>Select Specific Week(s)</label>
          <Select
            isMulti
            options={weekOptions}
            value={selectedWeeks}
            onChange={setSelectedWeeks}
            placeholder="Choose options"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      {/* Detailed Sales Table */}
      <div className="detailed-sales-section">
        <h3 className="subsection-title"><FileText size={18} />Detailed Sales for Selected Range</h3>
        <div className="table-wrapper">
          <table className="detailed-sales-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Financial Year</th>
                <th>Week #</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {detailedTable.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  <td className="branch-cell">{row.branch}</td>
                  <td>{row.financialYear}</td>
                  <td>{row.week}</td>
                  <td className="amount-cell">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {detailedTable.length > 10 && (
            <p className="table-note">Showing top 10 of {detailedTable.length} records</p>
          )}
        </div>

        {/* Total Display */}
        <div className="total-display">
          <span className="total-label">Total Sales for Selected Range:</span>
          <span className="total-value">{formatCurrency(totalSales)}</span>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="sales-trend-section">
        <h3 className="subsection-title"><TrendingUp size={18} />Sales Trend for Selected Range</h3>
        <div className="chart-subtitle">Sales Trend by Week</div>
        <Plot
          data={chartData}
          layout={{
            xaxis: {
              title: 'Week',
              showgrid: true,
              gridcolor: '#f0f0f0'
            },
            yaxis: {
              title: 'Sales',
              showgrid: true,
              gridcolor: '#f0f0f0'
            },
            legend: {
              orientation: 'h',
              x: 0.5,
              xanchor: 'center',
              y: 1.1
            },
            hovermode: 'x unified',
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            margin: { l: 60, r: 40, t: 60, b: 60 }
          }}
          config={{
            responsive: true,
            displayModeBar: false
          }}
          style={{ width: '100%', height: '500px' }}
        />
      </div>
    </div>
  );
}

export default QuarterWeekAnalysis;
