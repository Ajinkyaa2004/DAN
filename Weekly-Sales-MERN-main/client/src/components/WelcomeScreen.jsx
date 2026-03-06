import React from 'react';
import { UploadCloud, BarChart3, TrendingUp, Users, Calendar, FileSpreadsheet, Info, ArrowRight } from 'lucide-react';
import './WelcomeScreen.css';

function WelcomeScreen() {
  const features = [
    { icon: <TrendingUp size={18} />, title: 'Monthly Branch Sales', desc: 'Track sales trends across branches over time' },
    { icon: <Users size={18} />, title: 'Customer Trends', desc: 'Identify customers with rising or dropping sales' },
    { icon: <BarChart3 size={18} />, title: 'Purchase Analysis', desc: 'Deep dive into individual customer behaviour' },
    { icon: <Calendar size={18} />, title: 'Annual Sales Analysis', desc: 'Compare performance across financial years' },
  ];

  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <div className="welcome-icon-wrap">
          <BarChart3 size={38} />
        </div>
        <h1 className="welcome-title">Invoice & Customer Analysis Dashboard</h1>
        <p className="welcome-subtitle">Upload your sales data to get started with powerful insights and visualisations</p>
      </div>

      <div className="welcome-grid">
        <div className="welcome-card instructions-card">
          <div className="welcome-card-header">
            <Info size={18} />
            <h3>Getting Started</h3>
          </div>
          <ol className="welcome-steps">
            <li>
              <span className="step-num">1</span>
              <div>
                <strong>Upload Sales CSVs</strong>
                <p>Upload the NSW, QLD and WA CSV files using the sidebar uploader</p>
              </div>
            </li>
            <li>
              <span className="step-num">2</span>
              <div>
                <strong>Upload Historical Data</strong>
                <p>Optionally upload the Historical Excel file for annual analysis</p>
              </div>
            </li>
            <li>
              <span className="step-num">3</span>
              <div>
                <strong>Required CSV Columns</strong>
                <div className="column-list">
                  <span>Entity Name</span> <span>Branch Region</span> <span>Branch</span>
                  <span>Division</span> <span>Due Date</span> <span>Customer</span>
                  <span>Invoice ID</span> <span>Issue Date</span> <span>Total</span>
                  <span>Outstanding</span> <span>Status</span>
                </div>
              </div>
            </li>
            <li>
              <span className="step-num">4</span>
              <div>
                <strong>Apply Filters & Explore</strong>
                <p>Use the sidebar filters to refine data across tabs and charts</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="welcome-card features-card">
          <div className="welcome-card-header">
            <BarChart3 size={18} />
            <h3>Available Visualisations</h3>
          </div>
          <div className="features-list">
            {features.map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="welcome-cta">
            <UploadCloud size={18} />
            <span>Get started by uploading your sales data files in the sidebar</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
