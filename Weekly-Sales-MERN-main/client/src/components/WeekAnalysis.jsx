import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import Plot from 'react-plotly.js';
import { Calendar, FileText, TrendingUp } from 'lucide-react';
import './WeekAnalysis.css';

function WeekAnalysis({ historicalData }) {
  const [selectedWeeks, setSelectedWeeks] = useState([]);

  // Week options for selector (1-52)
  const weekOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= 52; i++) {
      options.push({ value: i, label: `Week ${i}` });
    }
    return options;
  }, []);

  // Filtered data for selected weeks (show ALL if nothing selected)
  const filteredWeekData = useMemo(() => {
    if (!historicalData) return [];

    // If no weeks selected, show all data
    if (selectedWeeks.length === 0) {
      return historicalData.map(row => ({
        branch: row.Branch,
        financialYear: row.FinancialYear,
        week: parseInt(row.Week),
        total: parseFloat(row.Total) || 0
      }));
    }

    // Otherwise filter by selected weeks
    const selectedWeekNumbers = selectedWeeks.map(w => w.value);
    
    return historicalData.filter(row => {
      const weekNum = parseInt(row.Week);
      return selectedWeekNumbers.includes(weekNum);
    }).map(row => ({
      branch: row.Branch,
      financialYear: row.FinancialYear,
      week: parseInt(row.Week),
      total: parseFloat(row.Total) || 0
    }));
  }, [historicalData, selectedWeeks]);

  // Total for selected weeks
  const selectedTotal = useMemo(() => {
    return filteredWeekData.reduce((sum, row) => sum + row.total, 0);
  }, [filteredWeekData]);

  // Sales trend chart for selected weeks (by branch-year combinations)
  const salesTrendChart = useMemo(() => {
    if (filteredWeekData.length === 0) return [];

    // Group by branch + year combinations
    const seriesData = {};
    
    filteredWeekData.forEach(row => {
      const key = `${row.branch} ${row.financialYear}`;
      if (!seriesData[key]) {
        seriesData[key] = {
          branch: row.branch,
          year: row.financialYear,
          data: []
        };
      }
      seriesData[key].data.push({ week: row.week, total: row.total });
    });

    const colors = { WA: '#6366f1', NSW: '#2563eb', QLD: '#0ea5e9' };

    return Object.keys(seriesData).map(key => {
      const series = seriesData[key];
      // Sort by week
      series.data.sort((a, b) => a.week - b.week);
      
      return {
        x: series.data.map(d => d.week),
        y: series.data.map(d => d.total),
        name: key,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: colors[series.branch] || '#666', width: 2 },
        marker: { size: 4 }
      };
    });
  }, [filteredWeekData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="week-analysis">
        <h2 className="section-title"><Calendar size={22} />Week-wise Analysis</h2>
        <p className="no-data-message">No historical data available.</p>
      </div>
    );
  }

  return (
    <div className="week-analysis">
      <h2 className="section-title"><Calendar size={22} />Week-wise Analysis</h2>

      {/* Week Range Analysis Section */}
      <div className="week-selector-section">
        <h3 className="subsection-title"><Calendar size={18} />Week Range Analysis</h3>
        <label>Select Specific Week(s) to Filter (Shows all by default)</label>
        <Select
          isMulti
          options={weekOptions}
          value={selectedWeeks}
          onChange={setSelectedWeeks}
          placeholder="All weeks shown - select to filter..."
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* Detailed Sales - Always visible */}
      <div className="detailed-sales-section">
        <h3 className="subsection-title"><FileText size={18} />Detailed Sales {selectedWeeks.length > 0 ? 'for Selected Range' : '(All Weeks)'}</h3>
        <div className="table-wrapper">
          <table className="week-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Financial Year</th>
                <th>Week #</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {filteredWeekData.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.branch}</td>
                  <td>{row.financialYear}</td>
                  <td>{row.week}</td>
                  <td className="amount-cell">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredWeekData.length > 10 && (
            <p className="table-note">Showing first 10 of {filteredWeekData.length} records</p>
          )}
        </div>

        {/* Total Display */}
        <div className="total-display">
          <span className="total-label">Total Sales {selectedWeeks.length > 0 ? 'for Selected Range' : '(All Weeks)'}:</span>
          <span className="total-value">{formatCurrency(selectedTotal)}</span>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="sales-trend-section">
        <h3 className="subsection-title"><TrendingUp size={18} />Sales Trend {selectedWeeks.length > 0 ? 'for Selected Range' : '(All Weeks)'}</h3>
        <div className="chart-subtitle">Sales Trend by Week</div>
        <Plot
          data={salesTrendChart}
          layout={{
            font: { family: 'Inter, sans-serif', color: '#64748b' },
            xaxis: {
              title: 'Week',
              showgrid: true,
              gridcolor: '#f1f5f9',
              zeroline: false,
              tickfont: { color: '#94a3b8' },
              dtick: 1
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
              orientation: 'v',
              x: 1.02,
              y: 1,
              xanchor: 'left',
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
          style={{ width: '100%', height: '420px' }}
        />
      </div>
    </div>
  );
}

export default WeekAnalysis;
