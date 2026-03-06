import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import Plot from 'react-plotly.js';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomerDetail.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CustomerDetail({ filteredData, selectedBranches, droppingCustomers }) {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [detailData, setDetailData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get unique customers from filtered data
  const customerOptions = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const customers = [...new Set(filteredData.map(r => r.Customer).filter(Boolean))];
    return customers.sort().map(c => ({ value: c, label: c }));
  }, [filteredData]);

  // Get date range limits
  const dateRangeLimits = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [null, null];
    const dates = filteredData.map(r => new Date(r.IssueDate)).filter(d => !isNaN(d));
    if (dates.length === 0) return [null, null];
    return [new Date(Math.min(...dates)), new Date(Math.max(...dates))];
  }, [filteredData]);

  // Initialize with first customer and full date range
  useEffect(() => {
    if (customerOptions.length > 0 && selectedCustomers.length === 0) {
      setSelectedCustomers([customerOptions[0]]);
    }
    if (dateRangeLimits[0] && !dateRange[0]) {
      setDateRange(dateRangeLimits);
    }
  }, [customerOptions, dateRangeLimits, selectedCustomers.length, dateRange]);

  // Fetch customer detail data
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!filteredData || filteredData.length === 0 || selectedCustomers.length === 0) return;

      setIsLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/analyze/customer-detail`, {
          data: filteredData,
          branches: selectedBranches,
          customers: selectedCustomers.map(c => c.value),
          dateRange: dateRange
        });

        setDetailData(response.data);
      } catch (error) {
        console.error('Error fetching customer detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailData();
  }, [filteredData, selectedBranches, selectedCustomers, dateRange]);

  // Check if any selected customer is dropping
  const droppingWarnings = useMemo(() => {
    if (!droppingCustomers || !selectedCustomers) return [];
    return selectedCustomers.filter(c => 
      droppingCustomers.some(dc => dc.Customer === c.value)
    );
  }, [selectedCustomers, droppingCustomers]);

  // Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'Customer',
      header: 'Customer',
      cell: info => info.getValue()
    },
    {
      accessorKey: 'IssueDate',
      header: 'Issue Date',
      cell: info => {
        const date = new Date(info.getValue());
        return date.toLocaleDateString('en-GB');
      }
    },
    {
      accessorKey: 'Branch',
      header: 'Branch',
      cell: info => info.getValue()
    },
    {
      accessorKey: 'Invoice ID',
      header: 'Invoice ID',
      cell: info => info.getValue()
    },
    {
      accessorKey: 'Total',
      header: 'Total',
      cell: info => `$${info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  ], []);

  const table = useReactTable({
    data: detailData?.purchases || [],
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

  // Prepare yearly chart data
  const yearlyChartData = useMemo(() => {
    if (!detailData?.yearly) return [];
    
    const customers = [...new Set(detailData.yearly.map(r => r.Customer))];
    
    return customers.map(customer => {
      const customerData = detailData.yearly.filter(r => r.Customer === customer);
      customerData.sort((a, b) => a.Year - b.Year);
      
      return {
        x: customerData.map(r => r.Year),
        y: customerData.map(r => r.Total),
        type: 'bar',
        name: customer,
        hovertemplate: 'Year: %{x}<br>Total: $%{y:,.2f}<extra></extra>'
      };
    });
  }, [detailData]);

  // Prepare monthly chart data
  const monthlyChartData = useMemo(() => {
    if (!detailData?.monthly) return [];
    
    const customers = [...new Set(detailData.monthly.map(r => r.Customer))];
    
    return customers.map(customer => {
      const customerData = detailData.monthly.filter(r => r.Customer === customer);
      customerData.sort((a, b) => a.Month.localeCompare(b.Month));
      
      return {
        x: customerData.map(r => r.Month),
        y: customerData.map(r => r.Total),
        type: 'scatter',
        mode: 'lines+markers',
        name: customer,
        line: { width: 2 },
        marker: { size: 8 },
        hovertemplate: 'Month: %{x}<br>Total: $%{y:,.2f}<extra></extra>'
      };
    });
  }, [detailData]);

  if (!filteredData || filteredData.length === 0) {
    return null;
  }

  return (
    <div className="customer-detail">
      <h2 className="section-header">▸ Customer-wise Purchase Analysis</h2>

      {/* Customer and Date Filters */}
      <div className="customer-filters">
        <div className="filter-group">
          <label>Select Customer(s)</label>
          <Select
            isMulti
            options={customerOptions}
            value={selectedCustomers}
            onChange={setSelectedCustomers}
            placeholder="Select customers..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-range-inputs">
            <DatePicker
              selected={dateRange[0]}
              onChange={(date) => setDateRange([date, dateRange[1]])}
              selectsStart
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              minDate={dateRangeLimits[0]}
              maxDate={dateRangeLimits[1]}
              dateFormat="dd/MM/yyyy"
              placeholderText="Start date"
            />
            <span>to</span>
            <DatePicker
              selected={dateRange[1]}
              onChange={(date) => setDateRange([dateRange[0], date])}
              selectsEnd
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              minDate={dateRangeLimits[0]}
              maxDate={dateRangeLimits[1]}
              dateFormat="dd/MM/yyyy"
              placeholderText="End date"
            />
          </div>
        </div>
      </div>

      {/* Dropping Customer Warnings */}
      {droppingWarnings.map(customer => (
        <div key={customer.value} className="dropping-warning">
          <AlertTriangle size={20} />
          <span>
            <strong>{customer.value}</strong> is a dropping customer (sales declined in recent years)
          </span>
        </div>
      ))}

      {isLoading ? (
        <LoadingSpinner message="Loading customer details..." />
      ) : detailData ? (
        <>
          {/* Purchase Records Table */}
          <div className="chart-container">
            <h3>Filtered Purchase Records</h3>
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

          {/* Total Purchase Metric */}
          <div className="metric-card">
            <div className="metric-label">Total Purchase for Filtered Records</div>
            <div className="metric-value">
              ${detailData.totalPurchase?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Yearly Purchase Chart */}
            <div className="chart-container">
              <Plot
                data={yearlyChartData}
                layout={{
                  title: 'Yearly Purchase Summary',
                  xaxis: {
                    title: 'Year',
                    type: 'category'
                  },
                  yaxis: {
                    title: 'Total'
                  },
                  barmode: 'group',
                  hovermode: 'x unified',
                  showlegend: true,
                  autosize: true
                }}
                config={{ responsive: true }}
                style={{ width: '100%', height: '400px' }}
              />
            </div>

            {/* Monthly Purchase Chart */}
            <div className="chart-container">
              <Plot
                data={monthlyChartData}
                layout={{
                  title: 'Monthly Purchase Trend',
                  xaxis: {
                    title: 'Month',
                    type: 'category'
                  },
                  yaxis: {
                    title: 'Total'
                  },
                  hovermode: 'x unified',
                  showlegend: true,
                  autosize: true
                }}
                config={{ responsive: true }}
                style={{ width: '100%', height: '400px' }}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default CustomerDetail;
