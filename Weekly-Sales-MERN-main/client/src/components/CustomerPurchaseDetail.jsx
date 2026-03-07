import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import Plot from 'react-plotly.js';
import { User, List as ListIcon, BarChart3, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomerPurchaseDetail.css';

function CustomerPurchaseDetail({ filteredData }) {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique customers from data
  const customerOptions = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const customers = [...new Set(filteredData.map(r => r.Customer))].filter(Boolean).sort();
    return customers.map(c => ({ value: c, label: c }));
  }, [filteredData]);

  // Filter data by selected customers and date range
  const customerData = useMemo(() => {
    if (!filteredData || selectedCustomers.length === 0) return [];

    const selectedNames = selectedCustomers.map(c => c.value);
    let data = filteredData.filter(row => selectedNames.includes(row.Customer));

    if (dateRange[0] && dateRange[1]) {
      data = data.filter(row => {
        const rowDate = new Date(row.IssueDate);
        return rowDate >= dateRange[0] && rowDate <= dateRange[1];
      });
    }

    return data;
  }, [filteredData, selectedCustomers, dateRange]);

  // Paginated purchase records
  const allPurchaseRecords = useMemo(() => {
    if (customerData.length === 0) return [];
    return customerData.map(row => ({
      customerName: row.Customer,
      date: row.IssueDate,
      branch: row.Branch,
      invoice: row['Invoice #'],
      totalPurchase: parseFloat(row.Total) || 0
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [customerData]);

  const totalPages = Math.ceil(allPurchaseRecords.length / itemsPerPage);
  const purchaseRecords = allPurchaseRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Total
  const totalForRange = useMemo(() => {
    return customerData.reduce((sum, row) => sum + (parseFloat(row.Total) || 0), 0);
  }, [customerData]);

  // Year-wise purchase totals — one trace per customer (array of traces)
  const yearwiseData = useMemo(() => {
    if (customerData.length === 0) return [];

    const defaultColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#ec4899'];
    const allCustomerNames = [...new Set(customerData.map(r => r.Customer))];

    return allCustomerNames.map((customerName, idx) => {
      const color = defaultColors[idx % defaultColors.length];
      const yearMap = {};
      customerData
        .filter(r => r.Customer === customerName)
        .forEach(row => {
          const year = String(new Date(row.IssueDate).getFullYear());
          yearMap[year] = (yearMap[year] || 0) + (parseFloat(row.Total) || 0);
        });
      const years = Object.keys(yearMap).sort();
      const values = years.map(y => yearMap[y]);
      return {
        x: years,
        y: values,
        name: customerName,
        type: 'bar',
        marker: { color, line: { width: 0 } },
        text: values.map(v => `$${(v / 1000).toFixed(1)}K`),
        textposition: 'outside'
      };
    });
  }, [customerData]);

  // Monthly purchase trend — one trace per customer (array of traces)
  const monthlyTrendData = useMemo(() => {
    if (customerData.length === 0) return [];

    const defaultColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#ec4899'];
    const allCustomerNames = [...new Set(customerData.map(r => r.Customer))];

    return allCustomerNames.map((customerName, idx) => {
      const color = defaultColors[idx % defaultColors.length];
      const monthMap = {};
      customerData
        .filter(r => r.Customer === customerName)
        .forEach(row => {
          const date = new Date(row.IssueDate);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthMap[key] = (monthMap[key] || 0) + (parseFloat(row.Total) || 0);
        });
      const months = Object.keys(monthMap).sort();
      return {
        x: months,
        y: months.map(m => monthMap[m]),
        name: customerName,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color, width: 2 },
        marker: { size: 5 }
      };
    });
  }, [customerData]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="customer-purchase-detail">
        <h2 className="section-title">
          <User size={22} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Customer-wise Purchase Detail
        </h2>
        <p className="no-data-message">No data available.</p>
      </div>
    );
  }

  return (
    <div className="customer-purchase-detail">
      <h2 className="section-title">
        <User size={22} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        Customer-wise Purchase Detail
      </h2>

      {/* Customer Selection */}
      <div className="customer-selector-section">
        <div className="selector-group">
          <label>Select Customer(s) to Analyze</label>
          <Select
            isMulti
            options={customerOptions}
            value={selectedCustomers}
            onChange={(val) => {
              setSelectedCustomers(val || []);
              setCurrentPage(1);
            }}
            placeholder="Choose one or more customers..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {selectedCustomers.length > 0 && (
          <div className="date-range-selector">
            <label>Select Date Range for Purchase Analysis</label>
            <div className="date-picker-row">
              <DatePicker
                selected={dateRange[0]}
                onChange={(date) => setDateRange([date, dateRange[1]])}
                selectsStart
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                placeholderText="Start Date"
                dateFormat="yyyy/MM/dd"
                className="date-input"
              />
              <span className="date-separator">to</span>
              <DatePicker
                selected={dateRange[1]}
                onChange={(date) => setDateRange([dateRange[0], date])}
                selectsEnd
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                minDate={dateRange[0]}
                placeholderText="End Date"
                dateFormat="yyyy/MM/dd"
                className="date-input"
              />
            </div>
          </div>
        )}
      </div>

      {selectedCustomers.length > 0 && customerData.length > 0 && (
        <>
          {/* Filtered Purchase Records */}
          <div className="purchase-records-section">
            <h3 className="subsection-title"><ListIcon size={16} /> Filtered Purchase Records</h3>
            <div className="table-wrapper">
              <table className="purchase-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Invoice</th>
                    <th>Total Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRecords.map((row, idx) => (
                    <tr key={idx}>
                      <td className="customer-cell">{row.customerName}</td>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.branch}</td>
                      <td>{row.invoice}</td>
                      <td className="amount-cell">{formatCurrency(row.totalPurchase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPurchaseRecords.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: currentPage === 1 ? '#e2e8f0' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#3b82f6', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, allPurchaseRecords.length)} of {allPurchaseRecords.length} records (Page {currentPage} of {totalPages})
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: currentPage >= totalPages ? '#e2e8f0' : '#fff', color: currentPage >= totalPages ? '#94a3b8' : '#3b82f6', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Total Display */}
            <div className="total-display">
              <span className="total-label">Total for Selected Date Range:</span>
              <span className="total-value">{formatCurrency(totalForRange)}</span>
            </div>
          </div>

          {/* Year-wise Purchase Totals */}
          <div className="yearwise-chart-section">
            <h3 className="subsection-title"><BarChart3 size={16} /> Year-wise Purchase Totals</h3>
            <div className="chart-subtitle">Annual Purchase Summary</div>
            <Plot
              data={yearwiseData}
              layout={{
                barmode: 'group',
                font: { family: 'Inter, sans-serif', color: '#64748b' },
                xaxis: {
                  title: 'Year',
                  showgrid: false,
                  zeroline: false,
                  tickfont: { color: '#94a3b8' },
                  type: 'category'
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
                margin: { l: 60, r: 20, t: 40, b: 50 },
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
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '360px' }}
            />
          </div>

          {/* Monthly Purchase Trend */}
          <div className="monthly-trend-section">
            <h3 className="subsection-title"><TrendingUp size={16} /> Monthly Purchase Trend</h3>
            <div className="chart-subtitle">Monthly Purchase History</div>
            <Plot
              data={monthlyTrendData}
              layout={{
                font: { family: 'Inter, sans-serif', color: '#64748b' },
                xaxis: {
                  title: 'Month',
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
                margin: { l: 60, r: 20, t: 40, b: 50 },
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
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '380px' }}
            />
          </div>
        </>
      )}

      {selectedCustomers.length > 0 && customerData.length === 0 && (
        <p className="no-data-message">No purchase records found for the selected criteria.</p>
      )}
    </div>
  );
}

export default CustomerPurchaseDetail;
