import React, { useState } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Configuration from './Configuration';
import FileUpload from './FileUpload';
import { ChevronRight, ChevronDown, BarChart3, X, AlertTriangle, Database, CheckCircle } from 'lucide-react';
import './Sidebar.css';

function Sidebar({
  collapsed,
  setCollapsed,
  config,
  setConfig,
  rawData,
  historicalData,
  setRawData,
  setHistoricalData,
  detectedSheets,
  setDetectedSheets,
  uniqueBranches,
  uniqueCustomers,
  yearRangeLimits,
  dateRangeLimits,
  uniqueFinancialYears,
  selectedBranches,
  setSelectedBranches,
  selectedCustomers,
  setSelectedCustomers,
  yearRange,
  setYearRange,
  dateRange,
  setDateRange,
  selectAllYears,
  setSelectAllYears,
  selectedFinancialYears,
  setSelectedFinancialYears
}) {
  const [dataFiltersExpanded, setDataFiltersExpanded] = useState(true);

  const isFromUnifiedDashboard = new URLSearchParams(window.location.search).has('sessionId');

  // Convert arrays to react-select format
  const branchOptions = uniqueBranches.map(b => ({ value: b, label: b }));
  const customerOptions = uniqueCustomers.map(c => ({ value: c, label: c }));
  const financialYearOptions = uniqueFinancialYears.map(y => ({ value: y, label: y }));

  const handleBranchChange = (selected) => {
    setSelectedBranches(selected ? selected.map(s => s.value) : []);
  };

  const handleBranchRemove = (branch) => {
    setSelectedBranches(selectedBranches.filter(b => b !== branch));
  };

  const handleCustomerChange = (selected) => {
    setSelectedCustomers(selected ? selected.map(s => s.value) : []);
  };

  const handleFinancialYearChange = (selected) => {
    setSelectedFinancialYears(selected ? selected.map(s => s.value) : []);
  };

  const handleFinancialYearRemove = (year) => {
    setSelectedFinancialYears(selectedFinancialYears.filter(y => y !== year));
  };

  const handleSelectAllYearsChange = (e) => {
    const checked = e.target.checked;
    setSelectAllYears(checked);
    if (checked) {
      setSelectedFinancialYears(uniqueFinancialYears);
    } else {
      // Default to first year only when unchecked
      setSelectedFinancialYears(uniqueFinancialYears.length > 0 ? [uniqueFinancialYears[0]] : []);
    }
  };

  const handleConfigApply = (newConfig) => {
    console.log('Configuration applied:', newConfig);
    // Here you can trigger data re-processing if needed
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="app-title">
          <BarChart3 className="app-icon" size={24} />
          {!collapsed && (
            <div className="app-title-text">
              <h2>Sales Analytics</h2>
              <p className="app-subtitle">Professional Dashboard v1.0</p>
            </div>
          )}
        </div>
        <button className="sidebar-close-btn" onClick={() => setCollapsed(true)} title="Collapse sidebar">
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-content">
        {/* Configuration Section */}
        <Configuration
          config={config}
          setConfig={setConfig}
          onApply={handleConfigApply}
        />

        {/* File Upload Section or Unified Info */}
        {!isFromUnifiedDashboard ? (
          <FileUpload
            config={config}
            setRawData={setRawData}
            setHistoricalData={setHistoricalData}
            detectedSheets={detectedSheets}
            setDetectedSheets={setDetectedSheets}
          />
        ) : (
          <div className="managed-data-card" style={{
            margin: '16px',
            padding: '20px',
            borderRadius: '12px',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
              <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '8px', color: '#0284c7' }}>
                <Database size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Unified Data Source</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Managed by Portal</span>
              </div>
            </div>
            
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
              Your data has been successfully synchronized from the central upload portal.
            </p>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12px', 
              color: '#059669', 
              fontWeight: '500',
              padding: '6px 10px',
              background: '#d1fae5',
              borderRadius: '6px',
              width: 'fit-content'
            }}>
              <CheckCircle size={14} />
              Active Connection
            </div>
          </div>
        )}

        {/* Filters - Only show when data is loaded */}
        {rawData && (
          <>
            <div className="filter-section">
              <button
                className="data-filter-toggle"
                onClick={() => setDataFiltersExpanded(!dataFiltersExpanded)}
              >
                {dataFiltersExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Data Filters</span>
              </button>

              {dataFiltersExpanded && (
                <div className="data-filter-content">
                  {/* Branch Filter */}
                  <div className="filter-group">
                    <label>Branch</label>
                    <Select
                      isMulti
                      options={branchOptions}
                      value={branchOptions.filter(opt => selectedBranches.includes(opt.value))}
                      onChange={handleBranchChange}
                      placeholder="Select branches..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPosition="fixed"
                    />

                    {/* Branch Chips */}
                    {selectedBranches.length > 0 && (
                      <div className="filter-chips">
                        {selectedBranches.map(branch => (
                          <div key={branch} className="filter-chip">
                            <span>{branch}</span>
                            <button
                              onClick={() => handleBranchRemove(branch)}
                              className="chip-remove"
                              aria-label={`Remove ${branch}`}
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Filter */}
                  <div className="filter-group">
                    <label>Customer</label>
                    <Select
                      isMulti
                      options={customerOptions}
                      value={customerOptions.filter(opt => selectedCustomers.includes(opt.value))}
                      onChange={handleCustomerChange}
                      placeholder="Select customers..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPosition="fixed"
                    />
                  </div>

                  {/* Year Range */}
                  {yearRangeLimits[0] !== null && (
                    <div className="filter-group">
                      <label>Year Range: {yearRange[0]} - {yearRange[1]}</label>
                      <div className="year-range-slider">
                        <div className="slider-container">
                          <div className="slider-track">
                            <div
                              className="slider-range"
                              style={{
                                left: `${((yearRange[0] - yearRangeLimits[0]) / (yearRangeLimits[1] - yearRangeLimits[0])) * 100}%`,
                                width: `${((yearRange[1] - yearRange[0]) / (yearRangeLimits[1] - yearRangeLimits[0])) * 100}%`
                              }}
                            />
                          </div>
                          <input
                            type="range"
                            min={yearRangeLimits[0]}
                            max={yearRangeLimits[1]}
                            value={yearRange[0] || yearRangeLimits[0]}
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value);
                              if (newMin <= yearRange[1]) {
                                setYearRange([newMin, yearRange[1]]);
                              }
                            }}
                            className="year-slider year-slider-min"
                          />
                          <input
                            type="range"
                            min={yearRangeLimits[0]}
                            max={yearRangeLimits[1]}
                            value={yearRange[1] || yearRangeLimits[1]}
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value);
                              if (newMax >= yearRange[0]) {
                                setYearRange([yearRange[0], newMax]);
                              }
                            }}
                            className="year-slider year-slider-max"
                          />
                        </div>
                        <div className="year-labels">
                          <span className="year-label">{yearRangeLimits[0]}</span>
                          <span className="year-label">{yearRangeLimits[1]}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date Range */}
                  {dateRangeLimits[0] !== null && (
                    <div className="filter-group">
                      <label>Issue Date Range</label>
                      <div className="date-range">
                        <DatePicker
                          selected={dateRange[0]}
                          onChange={(date) => setDateRange([date, dateRange[1]])}
                          selectsStart
                          startDate={dateRange[0]}
                          endDate={dateRange[1]}
                          minDate={dateRangeLimits[0]}
                          maxDate={dateRangeLimits[1]}
                          dateFormat="dd/MM/yyyy"
                          className="date-input"
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
                          className="date-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Historical Data Filters */}
            {historicalData && (
              <div className="filter-section">
                <h3>Historical Filters</h3>

                <div className="data-filter-content" style={{ animation: 'none' }}>
                  {/* Select All Financial Years Checkbox */}
                  <div className="filter-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectAllYears}
                        onChange={handleSelectAllYearsChange}
                      />
                      <span>Select All Financial Years</span>
                    </label>
                  </div>

                  {/* Financial Year Multiselect - Hidden when Select All is checked */}
                  {!selectAllYears && (
                    <div className="filter-group">
                      <label>Financial Years</label>
                      <Select
                        isMulti
                        options={financialYearOptions}
                        value={financialYearOptions.filter(opt => selectedFinancialYears.includes(opt.value))}
                        onChange={handleFinancialYearChange}
                        placeholder="Select financial years..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                        menuPosition="fixed"
                      />

                      {/* Financial Year Chips */}
                      {selectedFinancialYears.length > 0 && (
                        <div className="filter-chips">
                          {selectedFinancialYears.map(year => (
                            <div key={year} className="filter-chip">
                              <span>{year}</span>
                              <button
                                onClick={() => handleFinancialYearRemove(year)}
                                className="chip-remove"
                                aria-label={`Remove ${year}`}
                              >
                                <X size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedFinancialYears.length === 0 && (
                        <div className="filter-warning">
                          <AlertTriangle size={14} />
                          <span>Please select at least one financial year</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
