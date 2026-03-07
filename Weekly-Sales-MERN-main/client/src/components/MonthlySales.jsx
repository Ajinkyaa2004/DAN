import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Calendar } from 'lucide-react';
import './MonthlySales.css';

function MonthlySales({ filteredData, selectedBranches }) {
  // Compute monthly data fully on the frontend
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const branchesToUse = selectedBranches || [];
    const monthlyMap = {};

    filteredData.forEach(row => {
      // Respect selected branches and ignore unknown
      if (branchesToUse.length > 0 && !branchesToUse.includes(row.Branch)) return;
      if (row.Branch && row.Branch.toUpperCase() === 'UNKNOWN') return;

      const date = new Date(row.IssueDate);
      if (isNaN(date.getTime())) return;

      const monthStr = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthKey = `${monthStr} ${year}`;
      const sortKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const branch = row.Branch;

      const key = `${branch}_${sortKey}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          Branch: branch,
          Month: monthKey,
          sortKey: sortKey,
          Total: 0
        };
      }
      monthlyMap[key].Total += parseFloat(row.Total) || 0;
    });

    const monthlyDataArray = Object.values(monthlyMap);
    const uniqueBranches = [...new Set(monthlyDataArray.map(r => r.Branch))];

    // Chart styling colors
    const colorMap = {
       'WA': '#6366f1',
       'NSW': '#2563eb',
       'QLD': '#0ea5e9'
    };
    const defaultColors = ['#e11d48', '#10b981', '#f59e0b', '#8b5cf6'];

    return uniqueBranches.map((branch, idx) => {
      const branchData = monthlyDataArray.filter(r => r.Branch === branch);
      // Sort by chronological month
      branchData.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      
      const color = colorMap[branch] || defaultColors[idx % defaultColors.length];
      
      return {
        x: branchData.map(r => r.Month),
        y: branchData.map(r => r.Total),
        type: 'scatter',
        mode: 'lines+markers',
        name: branch,
        line: { color, width: 2 },
        marker: { size: 6 },
        hovertemplate: '%{x}<br>Sales: $%{y:,.2f}<extra></extra>'
      };
    });
  }, [filteredData, selectedBranches]);

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="monthly-sales" style={{ marginTop: '2rem' }}>
        <h2 className="section-title"><Calendar size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Monthly Branch Sales</h2>
        <div className="info-box">
          <p>No monthly sales data available for the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-sales" style={{ marginTop: '2rem' }}>
      <h2 className="section-title"><Calendar size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle'}}/> Monthly Branch Sales</h2>
      
      <div className="chart-container" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 className="subsection-title" style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '1rem' }}>Monthly Sales by Branch</h3>
        <Plot
          data={chartData}
          layout={{
            font: { family: 'Inter, sans-serif', color: '#64748b' },
            xaxis: {
              title: 'Month',
              type: 'category',
              showgrid: false,
              tickfont: { color: '#94a3b8' }
            },
            yaxis: {
              title: 'Total Sales',
              showgrid: true,
              gridcolor: '#e2e8f0',
              zeroline: false,
              tickfont: { color: '#94a3b8' }
            },
            hovermode: 'x unified',
            showlegend: true,
            legend: {
              orientation: 'h',
              x: 0.5,
              y: 1.15,
              xanchor: 'center',
              font: { color: '#475569', size: 11 }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 60, r: 20, t: 30, b: 60 },
            autosize: true
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '400px' }}
        />
      </div>
    </div>
  );
}

export default MonthlySales;
