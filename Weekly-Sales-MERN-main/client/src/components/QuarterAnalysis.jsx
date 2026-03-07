import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import Plot from 'react-plotly.js';
import { Calendar, BarChart3, ChevronDown, ChevronLeft, ChevronRight, List as ListIcon, TrendingUp } from 'lucide-react';
import './QuarterAnalysis.css';

function QuarterAnalysis({ historicalData, selectedBranches = [] }) {
  const [selectedQuarters, setSelectedQuarters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate quarter from week number
  const getQuarter = (week) => {
    if (week <= 13) return 'Q1';
    if (week <= 26) return 'Q2';
    if (week <= 39) return 'Q3';
    return 'Q4';
  };

  // Determine displayed branches
  const displayBranches = useMemo(() => {
    if (selectedBranches && selectedBranches.length > 0) {
      return selectedBranches;
    }
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

  // Generate quarter summary table data
  const quarterSummary = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    const quarterMap = {};

    historicalData.forEach(row => {
      const quarter = getQuarter(row.Week);
      const key = `${row.FinancialYear}-${quarter}`;
      
      if (!quarterMap[key]) {
        quarterMap[key] = {
          financialYear: row.FinancialYear,
          quarter: quarter,
          total: 0
        };
        displayBranches.forEach(b => quarterMap[key][b] = 0);
      }

      if (displayBranches.includes(row.Branch)) {
        const total = parseFloat(row.Total) || 0;
        quarterMap[key][row.Branch] = (quarterMap[key][row.Branch] || 0) + total;
        quarterMap[key].total += total;
      }
    });

    return Object.values(quarterMap).sort((a, b) => {
      if (a.financialYear !== b.financialYear) {
        return a.financialYear.localeCompare(b.financialYear);
      }
      return a.quarter.localeCompare(b.quarter);
    });
  }, [historicalData]);

  // Quarterly Sales Comparison chart data
  const quarterlyComparisonChart = useMemo(() => {
    if (quarterSummary.length === 0) return [];

    const quarters = quarterSummary.map(q => `${q.financialYear}\n${q.quarter}`);
    
    const colorMap = {
       'WA': '#3b82f6',
       'NSW': '#8b5cf6',
       'QLD': '#f59e0b'
    };
    const defaultColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#ec4899'];

    return displayBranches.map((branch, index) => {
      const color = colorMap[branch] || defaultColors[index % defaultColors.length];
      return {
        x: quarters,
        y: quarterSummary.map(q => q[branch] || 0),
        name: branch,
        type: 'bar',
        marker: { color, line: { width: 0 } }
      };
    });
  }, [quarterSummary, displayBranches]);

  // Quarter options for selector
  const quarterOptions = useMemo(() => {
    return quarterSummary.map(q => ({
      value: `${q.financialYear}-${q.quarter}`,
      label: `${q.financialYear} ${q.quarter}`
    }));
  }, [quarterSummary]);

  // Filtered data for selected quarters
  const filteredQuarterData = useMemo(() => {
    if (!historicalData || selectedQuarters.length === 0) return [];

    const selectedKeys = selectedQuarters.map(q => q.value);
    
    return historicalData.filter(row => {
      const quarter = getQuarter(row.Week);
      const key = `${row.FinancialYear}-${quarter}`;
      return selectedKeys.includes(key);
    }).map(row => ({
      branch: row.Branch,
      financialYear: row.FinancialYear,
      quarter: getQuarter(row.Week),
      total: parseFloat(row.Total) || 0
    }));
  }, [historicalData, selectedQuarters]);

  // Total for selected quarters
  const selectedTotal = useMemo(() => {
    return filteredQuarterData.reduce((sum, row) => sum + row.total, 0);
  }, [filteredQuarterData]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuarterData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuarterData.slice(indexOfFirstItem, indexOfLastItem);

  // Sales trend chart for selected quarters
  const salesTrendChart = useMemo(() => {
    if (filteredQuarterData.length === 0) return [];

    const branchData = {};
    
    filteredQuarterData.forEach(row => {
      if (!branchData[row.branch]) {
        branchData[row.branch] = { x: [], y: [] };
      }
      branchData[row.branch].x.push(`${row.financialYear} ${row.quarter}`);
      branchData[row.branch].y.push(row.total);
    });

    const colors = { WA: '#3b82f6', NSW: '#8b5cf6', QLD: '#f59e0b' };

    return Object.keys(branchData).map(branch => ({
      x: branchData[branch].x,
      y: branchData[branch].y,
      name: branch,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: colors[branch] || '#666', width: 2 },
      marker: { size: 6 }
    }));
  }, [filteredQuarterData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="quarter-analysis">
        <h2 className="section-title"><Calendar size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Quarter Analysis</h2>
        <p className="no-data-message">No historical data available.</p>
      </div>
    );
  }

  return (
    <div className="quarter-analysis">
      <h2 className="section-title"><Calendar size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Quarter Analysis</h2>

      {/* Quarterly Sales Comparison Chart */}
      <div className="quarterly-comparison-section">
        <h3 className="subsection-title"><BarChart3 size={18} style={{marginRight: '0.4rem'}}/> Quarterly Sales Comparison</h3>
        <Plot
          data={quarterlyComparisonChart}
          layout={{
            barmode: 'group',
            font: { family: 'Inter, sans-serif', color: '#64748b' },
            xaxis: {
              title: '',
              showgrid: false,
              zeroline: false,
              tickfont: { color: '#94a3b8' }
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
            margin: { l: 60, r: 20, t: 30, b: 60 },
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
          style={{ width: '100%', height: '450px' }}
        />
      </div>

      {/* Quarter Summary Table */}
      <div className="quarter-summary-section">
        <h3 className="subsection-title"><BarChart3 size={18} style={{marginRight: '0.4rem'}}/> Quarterly Sales Summary</h3>
        <div className="table-wrapper">
          <table className="quarter-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Financial Year</th>
                <th>Quarter</th>
                {displayBranches.map(branch => (
                  <th key={branch}>{branch}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {quarterSummary.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{row.financialYear}</td>
                  <td>{row.quarter}</td>
                  {displayBranches.map(branch => (
                    <td key={branch}>{formatCurrency(row[branch] || 0)}</td>
                  ))}
                  <td className="total-cell">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Select Specific Quarters */}
      <div className="quarter-selector-section">
        <h3 className="subsection-title"><ChevronDown size={18} style={{marginRight: '0.4rem'}}/> Select Specific Quarter(s)</h3>
        <Select
          isMulti
          options={quarterOptions}
          value={selectedQuarters}
          onChange={(val) => {
            setSelectedQuarters(val);
            setCurrentPage(1);
          }}
          placeholder="Choose quarters..."
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* Detailed Sales for Selected Quarters - Only show if quarters are selected */}
      {selectedQuarters.length > 0 && (
        <>
          <div className="detailed-sales-section">
            <h3 className="subsection-title"><ListIcon size={18} style={{marginRight: '0.4rem'}}/> Detailed Sales for Selected Quarter(s)</h3>
            <div className="table-wrapper">
              <table className="detailed-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Financial Year</th>
                    <th>Quarter</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.branch}</td>
                      <td>{row.financialYear}</td>
                      <td>{row.quarter}</td>
                      <td className="amount-cell">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredQuarterData.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: currentPage === 1 ? '#e2e8f0' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#3b82f6', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500, transition: 'all 0.2s', fontSize: '0.875rem' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQuarterData.length)} of {filteredQuarterData.length} records (Page {currentPage} of {totalPages})
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: currentPage >= totalPages ? '#e2e8f0' : '#fff', color: currentPage >= totalPages ? '#94a3b8' : '#3b82f6', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 500, transition: 'all 0.2s', fontSize: '0.875rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Total Display */}
            <div className="total-display">
              <span className="total-label">Total Sales for Selected Quarter(s):</span>
              <span className="total-value">{formatCurrency(selectedTotal)}</span>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="sales-trend-section">
            <h3 className="subsection-title"><TrendingUp size={18} style={{marginRight: '0.4rem'}}/> Sales Trend for Selected Quarter(s)</h3>
            <div className="chart-subtitle">Selected Quarter(s) Sales</div>
            <Plot
              data={salesTrendChart}
              layout={{
                font: { family: 'Inter, sans-serif', color: '#64748b' },
                xaxis: {
                  title: 'Quarter',
                  showgrid: true,
                  gridcolor: '#f1f5f9',
                  zeroline: false,
                  tickfont: { color: '#94a3b8' }
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
        </>
      )}
    </div>
  );
}

export default QuarterAnalysis;
