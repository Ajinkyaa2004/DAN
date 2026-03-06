import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingDown, TrendingUp } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import './CustomerTrends.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CustomerTrends({ filteredData, selectedBranches }) {
  const [trendsData, setTrendsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTrendsData = async () => {
      if (!filteredData || filteredData.length === 0) return;

      setIsLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/analyze/customers`, {
          data: filteredData,
          branches: selectedBranches
        });

        setTrendsData(response.data);
      } catch (error) {
        console.error('Error fetching customer trends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendsData();
  }, [filteredData, selectedBranches]);

  if (isLoading) {
    return (
      <div className="customer-trends">
        <h2 className="section-header"><TrendingUp size={18} style={{marginRight: '0.4rem', color: 'var(--blue-primary)'}} /> Customer Trends (Drop vs Rise)</h2>
        <LoadingSpinner message="Loading customer trends..." />
      </div>
    );
  }

  if (!trendsData || !trendsData.years || trendsData.years.length < 2) {
    return (
      <div className="customer-trends">
        <h2 className="section-header"><TrendingUp size={18} style={{marginRight: '0.4rem', color: 'var(--blue-primary)'}} /> Customer Trends (Drop vs Rise)</h2>
        <div className="info-box">
          <p>Not enough years of data for drop/rise analysis.</p>
          <p>At least 2 years of data are required to identify customer trends.</p>
        </div>
      </div>
    );
  }

  const { dropping, rising, years } = trendsData;
  const lastYear = years[years.length - 1];
  const prevYear = years[years.length - 2];

  return (
    <div className="customer-trends">
      <h2 className="section-header"><TrendingUp size={18} style={{marginRight: '0.4rem', color: 'var(--blue-primary)'}} /> Customer Trends (Drop vs Rise)</h2>
      
      <div className="trends-grid">
        {/* Dropping Customers */}
        <div className="trend-section">
          <h3 className="dropping">
            <TrendingDown size={24} />
            Dropping Customers
          </h3>
          {dropping && dropping.length > 0 ? (
            <div className="trend-table-wrapper">
              <table className="trend-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>{prevYear}</th>
                    <th>{lastYear}</th>
                  </tr>
                </thead>
                <tbody>
                  {dropping.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.Customer}</td>
                      <td>${row[prevYear]?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>${row[lastYear]?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">No dropping customers found</div>
          )}
        </div>

        {/* Rising Customers */}
        <div className="trend-section">
          <h3 className="rising">
            <TrendingUp size={24} />
            Rising Customers
          </h3>
          {rising && rising.length > 0 ? (
            <div className="trend-table-wrapper">
              <table className="trend-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>{prevYear}</th>
                    <th>{lastYear}</th>
                  </tr>
                </thead>
                <tbody>
                  {rising.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.Customer}</td>
                      <td>${row[prevYear]?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>${row[lastYear]?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">No rising customers found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerTrends;
