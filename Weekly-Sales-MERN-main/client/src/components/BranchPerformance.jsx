import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Building2 } from 'lucide-react';
import './BranchPerformance.css';

function BranchPerformance({ historicalData }) {
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return null;

    // Calculate total sales by branch
    const branchTotals = {};
    
    historicalData.forEach(row => {
      const branch = row.Branch;
      const total = parseFloat(row.Total) || 0;

      if (!branchTotals[branch]) {
        branchTotals[branch] = 0;
      }
      branchTotals[branch] += total;
    });

    const branches = Object.keys(branchTotals).sort();
    const values = branches.map(b => branchTotals[b]);
    const total = values.reduce((sum, val) => sum + val, 0);
    const percentages = values.map(val => ((val / total) * 100).toFixed(1));

    const colors = {
      'WA': '#6366f1',
      'NSW': '#2563eb',
      'QLD': '#0ea5e9'
    };

    return {
      values: values,
      labels: branches,
      type: 'pie',
      hole: 0.4,
      marker: {
        colors: branches.map(b => colors[b] || '#999')
      },
      text: percentages.map(p => `${p}%`),
      textinfo: 'label+percent',
      textposition: 'outside',
      hovertemplate: '<b>%{label}</b><br>Sales: $%{value:,.2f}<br>Share: %{percent}<extra></extra>'
    };
  }, [historicalData]);

  if (!chartData) {
    return (
      <div className="branch-performance">
        <h3 className="subsection-title"><Building2 size={20} />Branch Performance Comparison</h3>
        <p className="no-data-message">No data available for branch performance analysis.</p>
      </div>
    );
  }

  return (
    <div className="branch-performance">
      <h3 className="subsection-title"><Building2 size={20} />Branch Performance Comparison</h3>
      <div className="donut-chart-container">
        <h4 className="chart-subtitle">Sales Distribution by Branch</h4>
        <Plot
          data={[chartData]}
          layout={{
            font: { family: 'Inter, sans-serif', color: '#64748b' },
            showlegend: true,
            legend: {
              orientation: 'h',
              x: 0.5,
              xanchor: 'center',
              y: -0.1,
              font: { color: '#475569', size: 11 }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 50, r: 50, t: 60, b: 60 },
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
          style={{ width: '100%', height: '400px' }}
        />
      </div>
    </div>
  );
}

export default BranchPerformance;
