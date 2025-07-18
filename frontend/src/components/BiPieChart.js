import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart } from '../chartSetup';

import { Box } from '@mui/material';

// Custom plugin to render values inside slices
const insideLabels = {
  id: 'insideLabels',
  afterDraw(chart, args, pluginOpts) {
    const { ctx } = chart;
    const dataArr = chart.data.datasets[0].data;
    const compareVal = dataArr.reduce((a, b) => a + b, 0);
    chart.getDatasetMeta(0).data.forEach((arc, index) => {
      const value = dataArr[index];
      if (value === 0 || value == null) return;
      const pct = compareVal ? (value / compareVal) * 100 : 0;
      const pos = arc.tooltipPosition();
      ctx.save();
      ctx.fillStyle = pluginOpts.color || '#fff';
      const radius = arc.outerRadius || 100;
      const pctFont = Math.max(10, radius * 0.18);
      const valueFont = Math.max(10, radius * 0.20);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const offset = radius * 0.15;
      ctx.font = `bold ${pctFont}px sans-serif`;
      ctx.fillText(`${pct.toFixed(0)}%`, pos.x, pos.y - offset);
      ctx.font = `bold ${valueFont}px sans-serif`;
      ctx.fillText(value.toFixed(1), pos.x, pos.y + offset);
      ctx.restore();
    });
  },
};

// Ensure the plugin is registered only once (important with React Fast Refresh/HMR)
if (typeof window !== 'undefined' && !window.__insideLabels_registered) {
  Chart.register(insideLabels);
  window.__insideLabels_registered = true;
}

const defaultColors = ['#3b82f6', '#8b5cf6', '#f472b6', '#10b981'];

const BiPieChart = ({ title, phaseLabels, phaseValues, compareLabel, compareValue, unit = '', colors, fontColor = '#ffffff' }) => {
  const [selected, setSelected] = useState(null);
  const [hiddenStates, setHiddenStates] = useState(phaseLabels.map(() => false));
  const chartRef = useRef(null);

  const data = {
    labels: phaseLabels,
    datasets: [
      {
        data: phaseValues.map((v, i) => {
          const value = typeof v === 'number' && !isNaN(v) ? v : 0;
          return hiddenStates[i] ? 0 : value;
        }),
        backgroundColor: colors || defaultColors,
        borderWidth: 0,
        hoverOffset: 8,
        offset: (ctx) => (ctx.dataIndex === selected ? 12 : 0),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const newState = !hiddenStates[index];
          
          // Update hidden states
          setHiddenStates(prev => {
            const newStates = [...prev];
            newStates[index] = newState;
            return newStates;
          });
          
          // Update chart data immediately
          if (chartRef.current && chartRef.current.chartInstance) {
            chartRef.current.chartInstance.update();
          }
        },
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => ({
                text: label,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: hiddenStates[i],
                index: i,
              }));
            }
            return [];
          },
        },
      },
      insideLabels: { color: fontColor },
      title: {
        display: Boolean(title),
        text: title,
        font: { size: 14, weight: 'bold' },
        padding: { bottom: 6 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(2)} ${unit}`.trim(),
        },
      },
    },
  };

  const handleClick = (evt, elements) => {
    if (elements && elements.length > 0) {
      setSelected((prev) => (prev === elements[0].index ? null : elements[0].index));
    }
  };

  return (
    <Box
      ref={chartRef}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '4px'
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: '8px'
        }}
      >
        <Pie
          data={data}
          options={options}
          onClick={handleClick}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      <div
        style={{
          textAlign: 'center',
          fontWeight: 'bold',
          padding: '8px',
          fontSize: '1.1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px'
        }}
      >
        {compareLabel}: {compareValue?.toFixed?.(2) ?? '--'} {unit}
      </div>
    </Box>
  );
};

export default BiPieChart;
