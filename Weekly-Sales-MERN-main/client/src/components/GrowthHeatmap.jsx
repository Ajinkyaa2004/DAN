import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { TrendingUp } from 'lucide-react';
import './GrowthHeatmap.css';

function GrowthHeatmap({ historicalData }) {
  // Calculate quarter from week number
  const getQuarter = (week) => {
    if (week <= 13) return 'Q1';
    if (week <= 26) return 'Q2';
    if (week <= 39) return 'Q3';
    return 'Q4';
  };

  const heatmapData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return null;

    // Group data by Financial Year and Quarter
    const yearQuarterMap = {};
    
    historicalData.forEach(row => {
      const year = row.FinancialYear;
      const quarter = getQuarter(row.Week);
      const total = parseFloat(row.Total) || 0;

      const key = `${year}-${quarter}`;
      if (!yearQuarterMap[key]) {
        yearQuarterMap[key] = 0;
      }
      yearQuarterMap[key] += total;
    });

    // Get all unique years and sort
    const years = [...new Set(historicalData.map(r => r.FinancialYear))].sort();
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Calculate year-over-year growth
    const growthData = [];
    const yearLabels = [];
    
    years.forEach((year, idx) => {
      if (idx === 0) return; // Skip first year (no previous year to compare)

      const prevYear = years[idx - 1];
      const currentRow = [];

      quarters.forEach(quarter => {
        const currentKey = `${year}-${quarter}`;
        const prevKey = `${prevYear}-${quarter}`;
        
        const currentVal = yearQuarterMap[currentKey] || 0;
        const prevVal = yearQuarterMap[prevKey] || 0;

        let growth = 0;
        if (prevVal !== 0) {
          growth = ((currentVal - prevVal) / prevVal) * 100;
        }

        currentRow.push(growth);
      });

      growthData.push(currentRow);
      yearLabels.push(year);
    });

    return {
      z: growthData,
      x: quarters,
      y: yearLabels,
      type: 'heatmap',
      colorscale: [
        [0, '#d32f2f'],      // Red for negative
        [0.5, '#fff59d'],    // Yellow for zero/low
        [1, '#388e3c']       // Green for positive
      ],
      zmid: 0,
      text: growthData.map(row => 
        row.map(val => `${val.toFixed(2)}%`)
      ),
      texttemplate: '%{text}',
      textfont: {
        size: 12,
        color: 'black'
      },
      hovertemplate: 'Year: %{y}<br>Quarter: %{x}<br>Growth: %{z:.2f}%<extra></extra>',
      colorbar: {
        title: 'Growth %',
        ticksuffix: '%'
      }
    };
  }, [historicalData]);

  if (!heatmapData) {
    return (
      <div className="growth-heatmap">
        <h3 className="subsection-title"><TrendingUp size={18} style={{marginRight: '0.4rem'}}/> Year-over-Year Growth Analysis</h3>
        <p className="no-data-message">No historical data available for growth analysis.</p>
      </div>
    );
  }

  return (
    <div className="growth-heatmap">
      <h3 className="subsection-title"><TrendingUp size={18} style={{marginRight: '0.4rem'}}/> Year-over-Year Growth Analysis</h3>
      <div className="heatmap-container">
        <Plot
          data={[heatmapData]}
          layout={{
            font: { family: 'Inter, sans-serif', color: '#64748b' },
            xaxis: {
              title: 'Quarter',
              side: 'bottom',
              showgrid: false,
              tickfont: { color: '#94a3b8' }
            },
            yaxis: {
              title: 'Financial Year',
              showgrid: false,
              tickfont: { color: '#94a3b8' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 80, r: 120, t: 40, b: 60 }
          }}
          config={{
            responsive: true,
            displayModeBar: false
          }}
          style={{ width: '100%', height: '500px' }}
        />
      </div>
    </div>
  );
}

export default GrowthHeatmap;
