import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HistoricalAnalysis from './HistoricalAnalysis';
import MonthlySales from './MonthlySales';
import OverviewWeeklySales from './OverviewWeeklySales';
import CustomerTrends from './CustomerTrends';
import CustomerDetail from './CustomerDetail';
import MetricCards from './MetricCards';
import AnnualPerformance from './AnnualPerformance';
import GrowthHeatmap from './GrowthHeatmap';
import BranchPerformance from './BranchPerformance';
import QuarterAnalysis from './QuarterAnalysis';
import WeekAnalysis from './WeekAnalysis';
import ComparativeAnalysis from './ComparativeAnalysis';
import CustomerAnalysisTab from './CustomerAnalysisTab';
import { BarChart3, TrendingUp, Calendar, GitCompare, Users, Database, Clock } from 'lucide-react';
import './Dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Dashboard({
  rawData,
  historicalData,
  selectedBranches,
  selectedCustomers,
  yearRange,
  dateRange,
  selectAllYears,
  selectedFinancialYears
}) {
  // Apply filters to raw data
  const filteredData = React.useMemo(() => {
    if (!rawData) return [];
    
    return rawData.filter(row => {
      // Exclude 'UNKNOWN' branch globally
      if (row.Branch && row.Branch.toUpperCase() === 'UNKNOWN') {
        return false;
      }

      // Branch filter
      if (selectedBranches.length > 0 && !selectedBranches.includes(row.Branch)) {
        return false;
      }
      
      // Customer filter
      if (selectedCustomers.length > 0 && !selectedCustomers.includes(row.Customer)) {
        return false;
      }
      
      // Year range filter
      if (yearRange[0] !== null && yearRange[1] !== null) {
        if (row.Year < yearRange[0] || row.Year > yearRange[1]) {
          return false;
        }
      }
      
      // Date range filter
      if (dateRange[0] && dateRange[1]) {
        const rowDate = new Date(row.IssueDate);
        if (rowDate < dateRange[0] || rowDate > dateRange[1]) {
          return false;
        }
      }
      
      return true;
    });
  }, [rawData, selectedBranches, selectedCustomers, yearRange, dateRange]);

  // Apply filters to historical data
  const filteredHistoricalData = React.useMemo(() => {
    if (!historicalData) return [];
    
    return historicalData.filter(row => {
      // Exclude 'UNKNOWN' branch globally
      if (row.Branch && row.Branch.toUpperCase() === 'UNKNOWN') {
        return false;
      }

      // Branch filter
      if (selectedBranches.length > 0 && !selectedBranches.includes(row.Branch)) {
        return false;
      }
      
      // Financial year filter
      const yearsToUse = selectAllYears ? 
        historicalData.map(r => r.FinancialYear).filter((v, i, a) => a.indexOf(v) === i) : 
        selectedFinancialYears;
      
      if (yearsToUse.length > 0 && !yearsToUse.includes(row.FinancialYear)) {
        return false;
      }
      
      return true;
    });
  }, [historicalData, selectedBranches, selectAllYears, selectedFinancialYears]);

  // Fetch dropping customers for warning badges
  const [droppingCustomers, setDroppingCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDroppingCustomers = async () => {
      if (!filteredData || filteredData.length === 0) return;

      try {
        const response = await axios.post(`${API_BASE_URL}/api/analyze/customers`, {
          data: filteredData,
          branches: selectedBranches
        });

        if (response.data && response.data.dropping) {
          setDroppingCustomers(response.data.dropping);
        }
      } catch (error) {
        console.error('Error fetching dropping customers:', error);
      }
    };

    fetchDroppingCustomers();
  }, [filteredData, selectedBranches]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Invoice & Customer Analysis Dashboard</h1>
        <div className="info-box">
          <p><Database size={14} /> {filteredData.length.toLocaleString()} sales records
          {historicalData && <><TrendingUp size={14} style={{marginLeft:'0.75rem'}} /> {filteredHistoricalData.length.toLocaleString()} historical records</>}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={20} />
          <span>Overview</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'quarter' ? 'active' : ''}`}
          onClick={() => setActiveTab('quarter')}
        >
          <Calendar size={18} />
          <span>Quarter Analysis</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}
        >
          <Clock size={16} />
          <span>Week Analysis</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'comparative' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparative')}
        >
          <GitCompare size={18} />
          <span>Comparative Analysis</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          <Users size={18} />
          <span>Customer Analysis</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <MetricCards
              filteredData={filteredData}
              historicalData={historicalData}
            />
            <AnnualPerformance historicalData={filteredHistoricalData} selectedBranches={selectedBranches} />
            <MonthlySales filteredData={filteredData} selectedBranches={selectedBranches} />
            <OverviewWeeklySales historicalData={filteredHistoricalData} selectedBranches={selectedBranches} />
            <GrowthHeatmap historicalData={filteredHistoricalData} />
            <BranchPerformance historicalData={filteredHistoricalData} />
          </div>
        )}

        {/* Quarter Analysis Tab */}
        {activeTab === 'quarter' && (
          <div className="tab-panel">
            <QuarterAnalysis historicalData={filteredHistoricalData} selectedBranches={selectedBranches} />
          </div>
        )}

        {/* Week Analysis Tab */}
        {activeTab === 'week' && (
          <div className="tab-panel">
            <WeekAnalysis historicalData={filteredHistoricalData} />
          </div>
        )}

        {/* Comparative Analysis Tab */}
        {activeTab === 'comparative' && (
          <div className="tab-panel">
            <ComparativeAnalysis historicalData={filteredHistoricalData} />
          </div>
        )}

        {/* Customer Analysis Tab */}
        {activeTab === 'customer' && (
          <div className="tab-panel">
            <CustomerAnalysisTab
              filteredData={filteredData}
              selectedBranches={selectedBranches}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
