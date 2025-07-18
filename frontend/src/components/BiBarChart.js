import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart } from '../chartSetup';
import { Box, Typography } from '@mui/material';


const defaultColors = ['#3b82f6', '#8b5cf6', '#f472b6', '#10b981'];

/**
 * Simple bar chart for showing three phase readings and their avg/total.
 * props:
 *   title   - chart title string
 *   labels  - array of 4 labels (A,B,C,Avg)
 *   values  - array of 4 numeric values (NaN allowed -> skipped)
 *   unit    - unit string appended to tooltip
 */
const BiBarChart = ({ title, labels, values, unit = '' }) => {
  const data = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: unit ? `Value (${unit})` : 'Value',
          data: values.map((v) => (typeof v === 'number' && !isNaN(v) ? v : null)),
          backgroundColor: defaultColors,
        },
      ],
    };
  }, [labels, values, unit]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw?.toFixed?.(2) ?? '--'} ${unit}`.trim(),
          },
        },
        title: {
          display: true,
          text: title,
          font: { size: 14, weight: 'bold' },
          padding: { bottom: 8 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    }),
    [title, unit]
  );

  return (
    <Box sx={{ height: 200 }}>
      <Bar data={data} options={options} />
    </Box>
  );
};

export default BiBarChart;
