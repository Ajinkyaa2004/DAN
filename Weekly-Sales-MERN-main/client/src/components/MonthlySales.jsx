import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import LoadingSpinner from './LoadingSpinner';
import './MonthlySales.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MonthlySales({ filteredData, selectedBranches, yearRange, dateRange }) {
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!filteredData || filteredData.length === 0) return;

      setIsLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/analyze/monthly`, {
          data: filteredData,
          branches: selectedBranches,
          yearRange: yearRange,
          dateRange: dateRange
        });

        setMonthlyData(response.data.monthly);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyData();
  }, [filteredData, selectedBranches, yearRange, dateRange]);

  // Prepare data for Plotly
  const chartData = React.useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];

    const branches = [...new Set(monthlyData.map(r => r.Branch))];
    
    return branches.map(branch => {
      const branchData = monthlyData.filter(r => r.Branch === branch);
      // Sort by month
      branchData.sort((a, b) => a.Month.localeCompare(b.Month));
      
      return {
        x: branchData.map(r => r.Month),
        y: branchData.map(r => r.Total),
        type: 'scatter',
        mode: 'lines+markers',
        name: branch,
        line: { width: 2 },
        marker: { size: 8 },
        hovertemplate: '%{x}<br>Sales: $%{y:,.2f}<extra></extra>'
      };
    });
  }, [monthlyData]);

  if (isLoading) {
    return (
      <div className="monthly-sales">
        <h2 className="section-header">▸ Monthly Branch Sales</h2>
        <LoadingSpinner message="Loading monthly sales data..." />
      </div>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="monthly-sales">
        <h2 className="section-header">▸ Monthly Branch Sales</h2>
        <div className="info-box">
          <p>No monthly sales data available for the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-sales">
      <h2 className="section-header">▸ Monthly Branch Sales</h2>
      
      <div className="chart-container">
        <Plot
          data={chartData}
          layout={{
            title: 'Monthly Sales by Branch',
            xaxis: {
              title: 'Month',
              type: 'category'
            },
            yaxis: {
              title: 'Sales'
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
    </div>
  );
}

export default MonthlySales;
