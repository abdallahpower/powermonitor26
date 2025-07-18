import React, { useRef, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart } from '../chartSetup';
import { useTheme } from '@mui/material';
import {
  Box,
  CircularProgress,
  Button
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';

// Register Chart.js components and plugins
// zoomPlugin already registered globally in chartSetup

// Helper functions for interval calculations
const calculateIntervalAverage = (context, interval) => {
  if (!context.length) return null;
  
  const timestamp = context[0].parsed.x;
  const date = new Date(timestamp);
  const values = context.map(ctx => ctx.parsed.y);
  
  // Filter out non-numeric values
  const numericValues = values.filter(val => 
    val !== undefined && val !== null && typeof val === 'number' && !isNaN(val)
  );
  
  if (numericValues.length === 0) return null;
  
  return numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
};

// Calculate average for the current hour
const calculateHourlyAverage = (context) => {
  return calculateIntervalAverage(context, 'hourly');
};

// Calculate average for the current day
const calculateDailyAverage = (context) => {
  return calculateIntervalAverage(context, 'daily');
};

// Calculate average for the current week
const calculateWeeklyAverage = (context) => {
  return calculateIntervalAverage(context, 'weekly');
};

// Calculate average for the current month
const calculateMonthlyAverage = (context) => {
  return calculateIntervalAverage(context, 'monthly');
};

const LineChart = ({ data, isLoading, onResetZoom }) => {
  const chartRef = useRef(null);
  const theme = useTheme();

  // Chart options with improved styling
  const chartOptions = useMemo(() => {
    // Find min and max values for auto scaling
    let min = 0;
    let max = 100;
    
    if (data.datasets && data.datasets.length > 0) {
      let allValues = [];
      data.datasets.forEach(dataset => {
        if (dataset.data && Array.isArray(dataset.data)) {
          const numericValues = dataset.data.filter(val => 
            val !== undefined && val !== null && typeof val === 'number' && !isNaN(val)
          );
          allValues = allValues.concat(numericValues);
        }
      });
      
      if (allValues.length > 0) {
                // Use iterative reduce instead of spread to avoid call-stack overflow with large datasets
        min = allValues.reduce((acc, val) => (val < acc ? val : acc), allValues[0]);
        max = allValues.reduce((acc, val) => (val > acc ? val : acc), allValues[0]);
        const range = max - min;
        const padding = range * 0.1;
        min = min - padding;
        max = max + padding;
      }
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              family: theme.typography.fontFamily,
              size: 12
            }
          },
        },
        title: {
          display: true,
          text: 'Historical Power Monitoring Data',
          font: {
            family: theme.typography.fontFamily,
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.primary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          padding: 10,
          boxPadding: 5,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                const value = context.parsed.y;
                label += value.toFixed(2);
              }
              return label;
            },
            footer: () => '' // Disabled for debugging stack overflow
          }
        }
      },
      scales: {
        y: {
          min: min,
          max: max,
          beginAtZero: min > 0 ? false : true,
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          ticks: {
            padding: 10,
            font: {
              family: theme.typography.fontFamily
            },
            callback: function(value) {
              if (Math.abs(value) >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'k';
              }
              return value.toFixed(1);
            }
          }
        },
        x: {
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          ticks: {
            padding: 10,
            font: {
              family: theme.typography.fontFamily
            }
          }
        }
      },
      animation: {
        duration: 1000
      }
    };
  }, [data, theme]);

  // Reset zoom handler
  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '500px' }}>
      {isLoading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <CircularProgress />
        </Box>
      )}
      <Line
        ref={chartRef}
        data={data}
        options={chartOptions}
      />
      <Button
        variant="outlined"
        startIcon={<RestoreIcon />}
        onClick={handleResetZoom}
        sx={{ mt: 2 }}
      >
        Reset Zoom
      </Button>
    </Box>
  );
};

export default LineChart;
