import React, { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import './Configuration.css';

function Configuration({ config, setConfig, onApply }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleQuarterChange = (quarter, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      quarters: {
        ...prev.quarters,
        [quarter]: {
          ...prev.quarters[quarter],
          [field]: parseInt(value) || 0
        }
      }
    }));
  };

  const handleApply = () => {
    setConfig(localConfig);
    onApply(localConfig);
  };

  return (
    <div className="configuration-section">
      <div className="settings-header">
        <Settings size={16} />
        <h3>SETTINGS</h3>
      </div>

      <div className="configuration-collapsible">
        <button 
          className="config-toggle" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown size={16} className={`arrow ${isExpanded ? 'expanded' : ''}`} />
          <span>Configuration</span>
        </button>

        {isExpanded && (
          <div className="config-content">
            <p className="config-description">
              Customize these settings if your data has a different structure
            </p>

            {/* Branch Names */}
            <div className="config-field">
              <label>Branch Names</label>
              <p className="field-help">Enter branch names (comma-separated)</p>
              <input
                type="text"
                value={localConfig.branchNames}
                onChange={(e) => handleChange('branchNames', e.target.value)}
                placeholder="NSW, QLD, WA"
              />
            </div>

            {/* Excel Sheet Names */}
            <div className="config-field">
              <label>Excel Sheet Names</label>
              <p className="field-help">Enter sheet names (comma-separated)</p>
              <input
                type="text"
                value={localConfig.sheetNames}
                onChange={(e) => handleChange('sheetNames', e.target.value)}
                placeholder="WA, QLD, NSW"
              />
            </div>

            {/* Date Format */}
            <div className="config-field">
              <label>Date Format</label>
              <p className="field-help">Date format in CSV files</p>
              <select
                value={localConfig.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Day First)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (Month First)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>

            {/* Currency Settings */}
            <div className="config-field">
              <label>Currency Settings</label>
              <p className="field-help">Currency Symbol</p>
              <input
                type="text"
                value={localConfig.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                placeholder="$"
                maxLength="3"
              />
            </div>

            {/* Week & Quarter Settings */}
            <div className="config-field">
              <label>Week & Quarter Settings</label>
              
              <div className="week-quarter-grid">
                <div className="week-setting">
                  <p className="field-help">Total Weeks in Year</p>
                  <div className="number-input">
                    <button onClick={() => handleChange('totalWeeks', Math.max(1, localConfig.totalWeeks - 1))}>−</button>
                    <input
                      type="number"
                      value={localConfig.totalWeeks}
                      onChange={(e) => handleChange('totalWeeks', parseInt(e.target.value) || 52)}
                      min="1"
                      max="53"
                    />
                    <button onClick={() => handleChange('totalWeeks', Math.min(53, localConfig.totalWeeks + 1))}>+</button>
                  </div>
                </div>

                {/* Q1 Settings */}
                <div className="quarter-row">
                  <div className="quarter-field">
                    <p className="field-help">Q1 Start</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q1', 'start', Math.max(1, localConfig.quarters.Q1.start - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q1.start}
                        onChange={(e) => handleQuarterChange('Q1', 'start', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q1', 'start', localConfig.quarters.Q1.start + 1)}>+</button>
                    </div>
                  </div>
                  <div className="quarter-field">
                    <p className="field-help">Q1 End</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q1', 'end', Math.max(1, localConfig.quarters.Q1.end - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q1.end}
                        onChange={(e) => handleQuarterChange('Q1', 'end', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q1', 'end', localConfig.quarters.Q1.end + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Q2 Settings */}
                <div className="quarter-row">
                  <div className="quarter-field">
                    <p className="field-help">Q2 Start</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q2', 'start', Math.max(1, localConfig.quarters.Q2.start - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q2.start}
                        onChange={(e) => handleQuarterChange('Q2', 'start', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q2', 'start', localConfig.quarters.Q2.start + 1)}>+</button>
                    </div>
                  </div>
                  <div className="quarter-field">
                    <p className="field-help">Q2 End</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q2', 'end', Math.max(1, localConfig.quarters.Q2.end - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q2.end}
                        onChange={(e) => handleQuarterChange('Q2', 'end', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q2', 'end', localConfig.quarters.Q2.end + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Q3 Settings */}
                <div className="quarter-row">
                  <div className="quarter-field">
                    <p className="field-help">Q3 Start</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q3', 'start', Math.max(1, localConfig.quarters.Q3.start - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q3.start}
                        onChange={(e) => handleQuarterChange('Q3', 'start', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q3', 'start', localConfig.quarters.Q3.start + 1)}>+</button>
                    </div>
                  </div>
                  <div className="quarter-field">
                    <p className="field-help">Q3 End</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q3', 'end', Math.max(1, localConfig.quarters.Q3.end - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q3.end}
                        onChange={(e) => handleQuarterChange('Q3', 'end', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q3', 'end', localConfig.quarters.Q3.end + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Q4 Settings */}
                <div className="quarter-row">
                  <div className="quarter-field">
                    <p className="field-help">Q4 Start</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q4', 'start', Math.max(1, localConfig.quarters.Q4.start - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q4.start}
                        onChange={(e) => handleQuarterChange('Q4', 'start', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q4', 'start', localConfig.quarters.Q4.start + 1)}>+</button>
                    </div>
                  </div>
                  <div className="quarter-field">
                    <p className="field-help">Q4 End</p>
                    <div className="number-input">
                      <button onClick={() => handleQuarterChange('Q4', 'end', Math.max(1, localConfig.quarters.Q4.end - 1))}>−</button>
                      <input
                        type="number"
                        value={localConfig.quarters.Q4.end}
                        onChange={(e) => handleQuarterChange('Q4', 'end', e.target.value)}
                        min="1"
                      />
                      <button onClick={() => handleQuarterChange('Q4', 'end', localConfig.quarters.Q4.end + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Year Comparison Window */}
                <div className="week-setting">
                  <p className="field-help">Year Comparison Window</p>
                  <div className="number-input">
                    <button onClick={() => handleChange('yearComparisonWindow', Math.max(1, localConfig.yearComparisonWindow - 1))}>−</button>
                    <input
                      type="number"
                      value={localConfig.yearComparisonWindow}
                      onChange={(e) => handleChange('yearComparisonWindow', parseInt(e.target.value) || 2)}
                      min="1"
                      max="10"
                    />
                    <button onClick={() => handleChange('yearComparisonWindow', Math.min(10, localConfig.yearComparisonWindow + 1))}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* CSV Header Row Checkbox */}
            <div className="config-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localConfig.csvHasHeader}
                  onChange={(e) => handleChange('csvHasHeader', e.target.checked)}
                />
                <span>CSV files have header row</span>
              </label>
            </div>

            {/* Apply Button */}
            <button className="apply-config-btn" onClick={handleApply}>
              Apply Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Configuration;
