import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { TrendingUp } from 'lucide-react';

function OverviewWeeklySales({ historicalData, selectedBranches }) {
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    const branchesToUse = selectedBranches || [];
    const seriesData = {};

    historicalData.forEach(row => {
      if (branchesToUse.length > 0 && !branchesToUse.includes(row.Branch)) return;
      if (row.Branch && row.Branch.toUpperCase() === 'UNKNOWN') return;

      const key = `${row.Branch}, ${row.FinancialYear}`;
      if (!seriesData[key]) {
        seriesData[key] = {
          branch: row.Branch,
          year: row.FinancialYear,
          data: []
        };
      }
      seriesData[key].data.push({ week: parseInt(row.Week), total: parseFloat(row.Total) || 0 });
    });

    const colorMap = {
       'WA': '#6366f1',
       'NSW': '#2563eb',
       'QLD': '#0ea5e9'
    };
    const defaultColors = ['#e11d48', '#10b981', '#f59e0b', '#8b5cf6'];

    return Object.keys(seriesData).map((key, idx) => {
      const series = seriesData[key];
      // Sort by week
      series.data.sort((a, b) => a.week - b.week);
      
      const color = colorMap[series.branch] || defaultColors[idx % defaultColors.length];
      
      return {
        x: series.data.map(d => d.week),
        y: series.data.map(d => d.total),
        name: key,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color, width: 2 },
        marker: { size: 4 }
      };
    });
  }, [historicalData, selectedBranches]);

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="overview-weekly-sales" style={{ marginTop: '2rem' }}>
        <h2 className="section-title"><TrendingUp size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Sales Trend for Selected Range</h2>
        <div className="info-box">
          <p>No weekly trend data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-weekly-sales" style={{ marginTop: '2rem' }}>
      <h2 className="section-title"><TrendingUp size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Sales Trend for Selected Range</h2>
      
      <div className="chart-container" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 className="subsection-title" style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '1rem' }}>Sales Trend by Week for Selected Range</h3>
        <Plot
          data={chartData}
          layout={{
            font: { family: 'Inter, sans-serif', color: '#64748b' },
            xaxis: {
              title: 'Week Number',
              showgrid: true,
              gridcolor: '#f1f5f9',
              zeroline: false,
              tickfont: { color: '#94a3b8' },
              dtick: 1
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
            legend: {
              title: { text: "Branch, Financial Year" },
              orientation: 'v',
              x: 1.02,
              y: 1,
              xanchor: 'left',
              font: { color: '#475569', size: 11 }
            },
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
          style={{ width: '100%', height: '420px' }}
        />
      </div>
    </div>
  );
}

export default OverviewWeeklySales;
