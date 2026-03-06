import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import Plot from 'react-plotly.js';
import { User, List as ListIcon, BarChart3, TrendingUp } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomerPurchaseDetail.css';

function CustomerPurchaseDetail({ filteredData }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);

  // Get unique customers
  const customerOptions = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const customers = [...new Set(filteredData.map(r => r.Customer))].filter(Boolean).sort();
    return customers.map(c => ({ value: c, label: c }));
  }, [filteredData]);

  // Filter data by customer and date range
  const customerData = useMemo(() => {
    if (!filteredData || !selectedCustomer) return [];

    let data = filteredData.filter(row => row.Customer === selectedCustomer.value);

    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      data = data.filter(row => {
        const rowDate = new Date(row.IssueDate);
        return rowDate >= dateRange[0] && rowDate <= dateRange[1];
      });
    }

    return data;
  }, [filteredData, selectedCustomer, dateRange]);

  // Filtered purchase records table
  const purchaseRecords = useMemo(() => {
    if (customerData.length === 0) return [];

    return customerData.map(row => ({
      customerName: row.Customer,
      date: row.IssueDate,
      branch: row.Branch,
      invoice: row['Invoice #'],
      totalPurchase: parseFloat(row.Total) || 0
    })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  }, [customerData]);

  // Total for selected date range
  const totalForRange = useMemo(() => {
    return customerData.reduce((sum, row) => sum + (parseFloat(row.Total) || 0), 0);
  }, [customerData]);

  // Year-wise purchase totals
  const yearwiseData = useMemo(() => {
    if (customerData.length === 0) return [];

    const yearMap = {};

    customerData.forEach(row => {
      const date = new Date(row.IssueDate);
      const year = date.getFullYear();
      const total = parseFloat(row.Total) || 0;

      if (!yearMap[year]) {
        yearMap[year] = 0;
      }
      yearMap[year] += total;
    });

    const years = Object.keys(yearMap).sort();
    const values = years.map(y => yearMap[y]);

    return {
      x: years,
      y: values,
      type: 'bar',
      marker: { color: '#2563eb', line: { width: 0 } },
      text: values.map(v => `$${(v / 1000).toFixed(1)}K`),
      textposition: 'outside'
    };
  }, [customerData]);

  // Monthly purchase trend
  const monthlyTrendData = useMemo(() => {
    if (customerData.length === 0) return [];

    const monthMap = {};

    customerData.forEach(row => {
      const date = new Date(row.IssueDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const total = parseFloat(row.Total) || 0;

      if (!monthMap[monthYear]) {
        monthMap[monthYear] = 0;
      }
      monthMap[monthYear] += total;
    });

    const months = Object.keys(monthMap).sort();
    const values = months.map(m => monthMap[m]);

    return {
      x: months,
      y: values,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#6366f1', width: 2 },
      marker: { size: 5 }
    };
  }, [customerData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="customer-purchase-detail">
        <h2 className="section-title"><User size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Customer-wise Purchase Detail</h2>
        <p className="no-data-message">No data available.</p>
      </div>
    );
  }

  return (
    <div className="customer-purchase-detail">
      <h2 className="section-title"><User size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Customer-wise Purchase Detail</h2>

      {/* Customer Selection */}
      <div className="customer-selector-section">
        <div className="selector-group">
          <label>Select Customer(s) to Analyze</label>
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="Choose a customer..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {selectedCustomer && (
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

      {selectedCustomer && customerData.length > 0 && (
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
              {customerData.length > 10 && (
                <p className="table-note">Showing most recent 10 of {customerData.length} records</p>
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
              data={[yearwiseData]}
              layout={{
                font: { family: 'Inter, sans-serif', color: '#64748b' },
                xaxis: {
                  title: 'Year',
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
                margin: { l: 60, r: 20, t: 30, b: 40 },
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
              style={{ width: '100%', height: '360px' }}
            />
          </div>

          {/* Monthly Purchase Trend */}
          <div className="monthly-trend-section">
            <h3 className="subsection-title"><TrendingUp size={16} /> Monthly Purchase Trend</h3>
            <div className="chart-subtitle">Monthly Purchase History</div>
            <Plot
              data={[monthlyTrendData]}
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
                margin: { l: 60, r: 20, t: 30, b: 50 },
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
              style={{ width: '100%', height: '380px' }}
            />
          </div>
        </>
      )}

      {selectedCustomer && customerData.length === 0 && (
        <p className="no-data-message">No purchase records found for the selected criteria.</p>
      )}
    </div>
  );
}

export default CustomerPurchaseDetail;
