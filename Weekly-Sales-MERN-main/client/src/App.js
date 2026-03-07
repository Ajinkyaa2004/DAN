import { useState, useMemo, useEffect } from 'react';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WelcomeScreen from './components/WelcomeScreen';
import { Menu, Loader, CheckCircle } from 'lucide-react';
import { fetchAndProcessSessionFiles } from './utils/sharedStorage';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // === Auto-loading State ===
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadError, setAutoLoadError] = useState(null);
  
  // === Configuration State ===
  const [config, setConfig] = useState({
    branchNames: 'NSW, QLD, WA',
    sheetNames: 'WA, QLD, NSW',
    dateFormat: 'DD/MM/YYYY',
    currencySymbol: '$',
    totalWeeks: 52,
    quarters: {
      Q1: { start: 1, end: 13 },
      Q2: { start: 14, end: 26 },
      Q3: { start: 27, end: 39 },
      Q4: { start: 40, end: 52 }
    },
    yearComparisonWindow: 2,
    csvHasHeader: false
  });

  // === Raw Data State ===
  const [rawData, setRawData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [detectedSheets, setDetectedSheets] = useState([]);

  // === Sidebar Filter State ===
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [yearRange, setYearRange] = useState([null, null]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectAllYears, setSelectAllYears] = useState(true);
  const [selectedFinancialYears, setSelectedFinancialYears] = useState([]);

  // === Derived Data (for filters) ===
  const uniqueBranches = useMemo(() => {
    if (!rawData) return [];
    const branches = new Set(
      rawData
        .map(row => row.Branch)
        .filter(b => b && b.toString().toUpperCase() !== 'UNKNOWN')
    );
    return Array.from(branches).sort();
  }, [rawData]);

  const uniqueCustomers = useMemo(() => {
    if (!rawData) return [];
    const customers = new Set(rawData.map(row => row.Customer).filter(Boolean));
    return Array.from(customers).sort();
  }, [rawData]);

  const yearRangeLimits = useMemo(() => {
    if (!rawData || rawData.length === 0) return [null, null];
    const years = rawData.map(row => row.Year).filter(y => y != null);
    return [Math.min(...years), Math.max(...years)];
  }, [rawData]);

  const dateRangeLimits = useMemo(() => {
    if (!rawData || rawData.length === 0) return [null, null];
    const dates = rawData.map(row => row.IssueDate).filter(d => d != null).map(d => new Date(d));
    return [new Date(Math.min(...dates)), new Date(Math.max(...dates))];
  }, [rawData]);

  const uniqueFinancialYears = useMemo(() => {
    if (!historicalData) return [];
    const years = new Set(historicalData.map(row => row.FinancialYear).filter(Boolean));
    return Array.from(years).sort();
  }, [historicalData]);

  // Auto-load files from shared storage if sessionId is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    
    // Start loading immediately if sessionId is present and we haven't loaded data yet
    if (sessionId && !rawData) {
      console.log('🔄 Auto-loading files from shared storage:', sessionId);
      setIsAutoLoading(true);
      
      fetchAndProcessSessionFiles(sessionId, setRawData, setHistoricalData)
        .then((success) => {
          if (success) {
            console.log('✅ Files auto-loaded successfully');
            // Keep loading state active briefly to show success
            setTimeout(() => setIsAutoLoading(false), 500);
          } else {
            setAutoLoadError('Failed to load pre-uploaded files');
            setIsAutoLoading(false);
          }
        })
        .catch((error) => {
          console.error('Error auto-loading files:', error);
          setAutoLoadError('Failed to load pre-uploaded files');
          setIsAutoLoading(false);
        });
    }
  }, [rawData]); // Only depend on rawData, not isAutoLoading

  // Initialize filters when data loads
  useMemo(() => {
    if (rawData && selectedBranches.length === 0) {
      setSelectedBranches(uniqueBranches);
    }
    if (rawData && yearRange[0] === null) {
      setYearRange(yearRangeLimits);
    }
    if (rawData && dateRange[0] === null) {
      setDateRange(dateRangeLimits);
    }
  }, [rawData, uniqueBranches, yearRangeLimits, dateRangeLimits, selectedBranches.length, yearRange, dateRange]);

  // Auto-loading screen
  if (isAutoLoading) {
    return (
      <div className="app-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          padding: '2.5rem',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated background gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #10b981, #3b82f6)',
            backgroundSize: '200% 100%',
            animation: 'gradient-shift 2s ease infinite'
          }}></div>

          {/* Main loader animation */}
          <div style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '2rem'
          }}>
            {/* Outer rotating ring */}
            <div style={{
              position: 'absolute',
              inset: '-10px',
              border: '4px solid transparent',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 2s linear infinite'
            }}></div>
            
            {/* Inner circle with icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <Loader size={40} style={{ color: 'white', animation: 'spin 1.5s linear infinite' }} />
            </div>

            {/* Orbiting dots */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              animation: 'spin 3s linear infinite reverse'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '8px',
                height: '8px',
                background: '#3b82f6',
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
              }}></div>
            </div>
          </div>

          {/* Text content */}
          <h2 style={{ 
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
            color: '#1e293b',
            animation: 'fade-in 0.6s ease-out'
          }}>
            Preparing Your Analytics
          </h2>
          <p style={{ 
            color: '#64748b',
            fontSize: '0.95rem',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Loading your sales data from the unified portal...
          </p>

          {/* Progress steps */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#10b981'
            }}>
              <CheckCircle size={16} />
              <span>Files retrieved</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#3b82f6',
              fontWeight: '600'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '3px solid #3b82f6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Processing data...</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '3px solid #e2e8f0',
                borderRadius: '50%'
              }}></div>
              <span>Loading dashboard</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '4px',
            background: '#f1f5f9',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              borderRadius: '999px',
              animation: 'progress 1.5s ease-in-out'
            }}></div>
          </div>

          <p style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            marginTop: '1.5rem'
          }}>
            This should only take a moment...
          </p>

          {/* CSS animations */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes progress {
              0% { width: 0%; transform: translateX(-100%); }
              50% { width: 70%; transform: translateX(0%); }
              100% { width: 100%; transform: translateX(0%); }
            }
            
            @keyframes gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Auto-load error screen
  if (autoLoadError) {
    return (
      <div className="app-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: '#c00'
          }}>
            ✕
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Failed to Load Files</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{autoLoadError}</p>
          <button 
            onClick={() => {
              setAutoLoadError(null);
              window.location.href = window.location.pathname;
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Upload Files Manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          config={config}
          setConfig={setConfig}
          rawData={rawData}
          historicalData={historicalData}
          setRawData={setRawData}
          setHistoricalData={setHistoricalData}
          detectedSheets={detectedSheets}
          setDetectedSheets={setDetectedSheets}
          uniqueBranches={uniqueBranches}
          uniqueCustomers={uniqueCustomers}
          yearRangeLimits={yearRangeLimits}
          dateRangeLimits={dateRangeLimits}
          uniqueFinancialYears={uniqueFinancialYears}
          selectedBranches={selectedBranches}
          setSelectedBranches={setSelectedBranches}
          selectedCustomers={selectedCustomers}
          setSelectedCustomers={setSelectedCustomers}
          yearRange={yearRange}
          setYearRange={setYearRange}
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectAllYears={selectAllYears}
          setSelectAllYears={setSelectAllYears}
          selectedFinancialYears={selectedFinancialYears}
          setSelectedFinancialYears={setSelectedFinancialYears}
        />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {sidebarCollapsed && (
            <button className="menu-toggle-btn" onClick={() => setSidebarCollapsed(false)}>
              <Menu size={24} />
            </button>
          )}
          {!rawData ? (
            <WelcomeScreen />
          ) : (
            <Dashboard
              rawData={rawData}
              historicalData={historicalData}
              selectedBranches={selectedBranches}
              selectedCustomers={selectedCustomers}
              yearRange={yearRange}
              dateRange={dateRange}
              selectAllYears={selectAllYears}
              selectedFinancialYears={selectedFinancialYears}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
