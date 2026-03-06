import React, { useState, useMemo } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Plot from 'react-plotly.js';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import LoadingSpinner from './LoadingSpinner';
import './HistoricalAnalysis.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QUARTER_OPTIONS = [
  { value: 'All Quarters', label: 'All Quarters' },
  { value: 'Q1 (Weeks 1-13)', label: 'Q1 (Weeks 1-13)' },
  { value: 'Q2 (Weeks 14-26)', label: 'Q2 (Weeks 14-26)' },
  { value: 'Q3 (Weeks 27-39)', label: 'Q3 (Weeks 27-39)' },
  { value: 'Q4 (Weeks 40-52)', label: 'Q4 (Weeks 40-52)' }
];

function HistoricalAnalysis({ historicalData, selectedBranches, selectedFinancialYears }) {
  const [selectedQuarters, setSelectedQuarters] = useState([{ value: 'All Quarters', label: 'All Quarters' }]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get unique weeks from filtered historical data
  const availableWeeks = useMemo(() => {
    if (!historicalData) return [];
    const weeks = new Set();
    historicalData.forEach(row => {
      if (typeof row.Week === 'number') {
        weeks.add(row.Week);
      }
    });
    return Array.from(weeks).sort((a, b) => a - b).map(w => ({ value: w, label: `Week ${w}` }));
  }, [historicalData]);

  // Fetch analysis data from backend
  React.useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!historicalData || historicalData.length === 0) return;

      setIsLoading(true);
      try {
        const quarters = selectedQuarters.map(q => q.value);
        const weeks = selectedWeeks.map(w => w.value);

        const response = await axios.post(`${API_BASE_URL}/api/analyze/historical`, {
          data: historicalData,
          branches: selectedBranches,
          financialYears: selectedFinancialYears,
          quarters: quarters,
          weeks: weeks
        });

        setAnalysisData(response.data);
      } catch (error) {
        console.error('Error fetching historical analysis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisData();
  }, [historicalData, selectedBranches, selectedFinancialYears, selectedQuarters, selectedWeeks]);

  const handleQuarterChange = (selected) => {
    setSelectedQuarters(selected || []);
  };

  const handleWeekChange = (selected) => {
    setSelectedWeeks(selected || []);
  };

  // Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'Branch',
      header: 'Branch',
      cell: info => info.getValue()
    },
    {
      accessorKey: 'FinancialYear',
      header: 'Financial Year',
      cell: info => info.getValue()
    },
    {
      accessorKey: 'Week',
      header: 'Week',
      cell: info => info.getValue()
    },
    {
      accessorKey: 'Total',
      header: 'Total',
      cell: info => `$${info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  ], []);

  const table = useReactTable({
    data: analysisData?.quarterWeekRows || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  // Prepare data for Sales Trend by Week chart
  const salesTrendData = useMemo(() => {
    if (!analysisData?.aggregatedByWeek) return [];

    const grouped = {};
    analysisData.aggregatedByWeek.forEach(row => {
      const key = `${row.Branch}-${row.FinancialYear}`;
      if (!grouped[key]) {
        grouped[key] = {
          branch: row.Branch,
          year: row.FinancialYear,
          weeks: [],
          totals: []
        };
      }
      grouped[key].weeks.push(row.Week);
      grouped[key].totals.push(row.Total);
    });

    return Object.values(grouped).map(group => ({
      x: group.weeks,
      y: group.totals,
      type: 'scatter',
      mode: 'lines+markers',
      name: `${group.branch} - ${group.year}`,
      line: { width: 2 },
      marker: { size: 6 }
    }));
  }, [analysisData]);

  // Prepare data for Financial Year Total Sales chart
  const annualSalesData = useMemo(() => {
    if (!analysisData?.annualTotals) return [];

    const branches = [...new Set(analysisData.annualTotals.map(r => r.Branch))];
    
    return branches.map(branch => {
      const branchData = analysisData.annualTotals.filter(r => r.Branch === branch);
      return {
        x: branchData.map(r => r.FinancialYear),
        y: branchData.map(r => r.Total),
        type: 'bar',
        name: branch,
        text: branchData.map(r => `$${(r.Total / 1000).toFixed(1)}k`),
        textposition: 'auto'
      };
    });
  }, [analysisData]);

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="historical-analysis">
        <div className="info-box">
          <p>📁 Upload an Excel file in the sidebar for Annual Sales Analysis.</p>
          <p>Your Excel file should contain sheets: WA, QLD, NSW.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historical-analysis">
      <h2 className="section-header">▸ Annual Sales Analysis</h2>

      {/* Quarter and Week Selectors */}
      <div className="selector-row">
        <div className="selector-group">
          <label>Select Quarter(s)</label>
          <Select
            isMulti
            options={QUARTER_OPTIONS}
            value={selectedQuarters}
            onChange={handleQuarterChange}
            placeholder="Select quarters..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="selector-group">
          <label>Select Specific Week(s) {selectedWeeks.length > 0 && '(overrides quarters)'}</label>
          <Select
            isMulti
            options={availableWeeks}
            value={selectedWeeks}
            onChange={handleWeekChange}
            placeholder="Select weeks..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading historical analysis..." size="large" />
      ) : (
        <>
          {/* Data Table */}
          {analysisData?.quarterWeekRows && analysisData.quarterWeekRows.length > 0 ? (
            <>
              <div className="chart-container">
                <h3>Quarter/Week Data</h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() ? (header.column.getIsSorted() === 'desc' ? ' 🔽' : ' 🔼') : ''}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </button>
                  <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Total Sales Metric */}
              <div className="metric-card">
                <div className="metric-label">Total Sales for Selected Range</div>
                <div className="metric-value">
                  ${analysisData.totalSales?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Sales Trend by Week Chart */}
              {salesTrendData.length > 0 && (
                <div className="chart-container">
                  <Plot
                    data={salesTrendData}
                    layout={{
                      title: 'Sales Trend by Week for Selected Range',
                      xaxis: {
                        title: 'Week Number',
                        dtick: 1
                      },
                      yaxis: {
                        title: 'Total Sales'
                      },
                      hovermode: 'x unified',
                      showlegend: true,
                      legend: {
                        orientation: 'h',
                        y: -0.2
                      },
                      autosize: true
                    }}
                    config={{ responsive: true }}
                    style={{ width: '100%', height: '500px' }}
                  />
                </div>
              )}

              {/* Financial Year Total Sales Comparison */}
              {annualSalesData.length > 0 && (
                <div className="chart-container">
                  <Plot
                    data={annualSalesData}
                    layout={{
                      title: 'Total Sales per Financial Year by Branch',
                      xaxis: {
                        title: 'Financial Year'
                      },
                      yaxis: {
                        title: 'Total Sales'
                      },
                      barmode: 'group',
                      hovermode: 'x unified',
                      showlegend: true,
                      legend: {
                        orientation: 'h',
                        y: -0.2
                      },
                      autosize: true
                    }}
                    config={{ responsive: true }}
                    style={{ width: '100%', height: '500px' }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="info-box">
              <p>No sales data available for selected quarter(s) and week(s).</p>
              <p>Try adjusting your filters or selecting different quarters/weeks.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HistoricalAnalysis;
