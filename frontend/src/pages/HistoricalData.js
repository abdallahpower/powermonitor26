import React, { useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Checkbox, 
  OutlinedInput,
  ToggleButtonGroup,
  ToggleButton,
  FormGroup,
  FormControlLabel,
  Divider,
  useTheme,
  Tooltip,
  Select,
  Chip,
  Stack,
  Tabs,
  Tab,
  Card,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { ArrowDropDown, InfoOutlined } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';

import PowerLineChart from '../components/LineChartRecharts';
import PowerBarChart from '../components/BarChartRecharts';

import { DataContext } from '../context/DataContext';

// Material UI Icons
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; // Changed from CalendarViewYear which doesn't exist

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TodayIcon from '@mui/icons-material/Today';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DateRangeIcon from '@mui/icons-material/DateRange';
import * as XLSX from 'xlsx';

// Chart.js already registered globally in chartSetup

// Time range presets
const TIME_RANGES = [
  { value: 'hour', label: 'Last Hour', icon: <AccessTimeIcon />, duration: { hours: 1 } },
  { value: 'day', label: 'Today', icon: <TodayIcon />, duration: { days: 1 } },
  { value: 'week', label: 'Last Week', icon: <CalendarTodayIcon />, duration: { weeks: 1 } },
  { value: 'month', label: 'Last Month', icon: <DateRangeIcon />, duration: { months: 1 } },
  { value: 'custom', label: 'Custom Range', icon: null }
];

// Available fields for selection
const AVAILABLE_FIELDS = [
  { field: 'Current_A', label: 'Current A' },
  { field: 'Current_B', label: 'Current B' },
  { field: 'Current_C', label: 'Current C' },
  { field: 'Current_N', label: 'Current N' },
  { field: 'Current_Avg', label: 'Current Avg' },
  { field: 'Voltage_A_B', label: 'Voltage A-B' },
  { field: 'Voltage_B_C', label: 'Voltage B-C' },
  { field: 'Voltage_C_A', label: 'Voltage C-A' },
  { field: 'Voltage_A_N', label: 'Voltage A-N' },
  { field: 'Voltage_B_N', label: 'Voltage B-N' },
  { field: 'Voltage_C_N', label: 'Voltage C-N' },
  { field: 'Voltage_L_L_Avg', label: 'Voltage L-L Avg' },
  { field: 'Voltage_L_N_Avg', label: 'Voltage L-N Avg' },
  { field: 'Active_Power_A', label: 'Active Power A' },
  { field: 'Active_Power_B', label: 'Active Power B' },
  { field: 'Active_Power_C', label: 'Active Power C' },
  { field: 'Active_Power_Total', label: 'Active Power Total' },
  { field: 'Reactive_Power_A', label: 'Reactive Power A' },
  { field: 'Reactive_Power_B', label: 'Reactive Power B' },
  { field: 'Reactive_Power_C', label: 'Reactive Power C' },
  { field: 'Reactive_Power_Total', label: 'Reactive Power Total' },
  { field: 'Apparent_Power_A', label: 'Apparent Power A' },
  { field: 'Apparent_Power_B', label: 'Apparent Power B' },
  { field: 'Apparent_Power_C', label: 'Apparent Power C' },
  { field: 'Apparent_Power_Total', label: 'Apparent Power Total' },
  { field: 'Power_Factor_Total', label: 'Power Factor Total' },
  { field: 'Frequency', label: 'Frequency' },
  { field: 'Active_Energy', label: 'Active Energy' },
  { field: 'Apparent_Energy', label: 'Apparent Energy' },
  { field: 'Reactive_Energy_D_R', label: 'Reactive Energy' },
  { field: 'THD_Current_A', label: 'THD Current A' },
  { field: 'THD_Current_B', label: 'THD Current B' },
  { field: 'THD_Current_C', label: 'THD Current C' },
  { field: 'THD_Current_N', label: 'THD Current N' },
  { field: 'THD_Voltage_A_B', label: 'THD Voltage A-B' },
  { field: 'THD_Voltage_B_C', label: 'THD Voltage B-C' },
  { field: 'THD_Voltage_C_A', label: 'THD Voltage C-A' },
  { field: 'THD_Voltage_L_L', label: 'THD Voltage L-L' },
  { field: 'THD_Voltage_A_N', label: 'THD Voltage A-N' },
  { field: 'THD_Voltage_B_N', label: 'THD Voltage B-N' },
  { field: 'THD_Voltage_C_N', label: 'THD Voltage C-N' },
  { field: 'THD_Voltage_L_N', label: 'THD Voltage L-N' }
];

// Generate random color for chart lines
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const HistoricalData = () => {
  const theme = useTheme();
  const { historicalData, isLoading, fetchHistoricalData } = useContext(DataContext);

  
  // State for date range
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [timeRange, setTimeRange] = useState('day');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // State for chart type and visual options
  const [chartType, setChartType] = useState('line');
  const [chartTab, setChartTab] = useState(0);
  const exportRef = useRef(null);
  
  // State for data summarization/aggregation
  const [aggregationInterval, setAggregationInterval] = useState('none');
  
  // State for selected fields
  const [selectedFields, setSelectedFields] = useState([]);
  // State for user-selected line colors
  const [fieldColors, setFieldColors] = useState({});

  // Default color palette used when a field first becomes selected
  const COLOR_PALETTE = [
    '#3f51b5', '#f44336', '#4caf50', '#ff9800', '#9c27b0',
    '#03a9f4', '#e91e63', '#00bcd4', '#8bc34a', '#ffc107',
    '#673ab7', '#009688', '#cddc39', '#ff5722', '#795548'
  ];

  const handleColorChange = (field, color) => {
    setFieldColors((prev) => ({ ...prev, [field]: color }));
  };

  // Ensure newly-selected fields get a default color and remove colors for unselected fields
  useEffect(() => {
    setFieldColors((prev) => {
      const updated = { ...prev };
      selectedFields.forEach((field, idx) => {
        if (!updated[field]) {
          updated[field] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
        }
      });
      Object.keys(updated).forEach((key) => {
        if (!selectedFields.includes(key)) {
          delete updated[key];
        }
      });
      return updated;
    });
  }, [selectedFields]);

  // Handle field selection
  const handleFieldsChange = (event) => {
    const { value } = event.target;
    setSelectedFields(value);
  };

  // Handle time range change
  const handleTimeRangeChange = (event, newRange) => {
    if (newRange === null) return;
    setTimeRange(newRange);
    
    if (newRange === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      const range = TIME_RANGES.find(r => r.value === newRange);
      if (range) {
        const end = dayjs();
        const start = dayjs().subtract(range.duration.hours || 0, 'hour')
                           .subtract(range.duration.days || 0, 'day')
                           .subtract(range.duration.weeks || 0, 'week')
                           .subtract(range.duration.months || 0, 'month');
        setStartDate(start);
        setEndDate(end);
      }
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (event, newType) => {
    if (newType === null) return;
    setChartType(newType);
  };

  // Handle chart tab change
  const handleChartTabChange = (event, newValue) => {
    setChartTab(newValue);
  };

  // Data aggregation function for different time intervals
  const aggregateData = useCallback((data, interval) => {
    if (!data.length || interval === 'none') return data;

    // Helper to build grouping key
    const getKey = (date) => {
      switch (interval) {
        case 'minutely':
          return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}T${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}:00`;
        case 'hourly':
          return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')} ${String(date.getUTCHours()).padStart(2,'0')}:00`;
        case 'daily':
          return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
        case 'monthly':
          return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;
        default:
          return date.toISOString();
      }
    };

    const map = new Map();

    data.forEach(item => {
      const date = new Date(item.Timestamp);
      const key = getKey(date);
      if (!map.has(key)) {
        const base = { Timestamp: key };
        selectedFields.forEach(f => {
          base[`${f}Sum`] = 0;
          base[`${f}Cnt`] = 0;
        });
        map.set(key, base);
      }
      const agg = map.get(key);
      selectedFields.forEach(f => {
        const val = item[f];
        if (typeof val === 'number' && !isNaN(val)) {
          agg[`${f}Sum`] += val;
          agg[`${f}Cnt`] += 1;
        }
      });
    });

    // Build result array with averages
    const result = [];
    map.forEach(agg => {
      const out = { Timestamp: agg.Timestamp };
      selectedFields.forEach(f => {
        const cnt = agg[`${f}Cnt`];
        out[f] = cnt ? parseFloat((agg[`${f}Sum`]/cnt).toFixed(2)) : null;
      });
      result.push(out);
    });

    // sort chronologically by timestamp
    // sort chronologically
    result.sort((a,b) => new Date(a.Timestamp) - new Date(b.Timestamp));

    // Forward-fill empty minute slots to keep line continuous
    if (interval === 'minutely') {
      selectedFields.forEach(field => {
        let lastVal = null;
        result.forEach(pt => {
          if (pt[field] === null || pt[field] === undefined || isNaN(pt[field])) {
            pt[field] = lastVal;
          } else {
            lastVal = pt[field];
          }
        });
      });
    }

    return result;
  }, [selectedFields]);


const formatLabel = useCallback((timestamp, interval) => {
  const date = new Date(timestamp);
  
  switch(interval) {
    case 'minutely':
      if (timeRange === 'day' || timeRange === 'hour') {
        const monthShort = date.toLocaleDateString(undefined, { month: 'short' });
        return `${date.getDate()} ${monthShort}\n${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
      }
      const h = date.getUTCHours();
      const m = date.getUTCMinutes();
      return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    case 'hourly':
      // If viewing last week, show day of month and hour
      if (timeRange === 'week' || timeRange === 'day' || timeRange === 'month' || timeRange === 'custom') {
        // Show day-of-month and hour
        const monthShort = date.toLocaleDateString(undefined, { month: 'short' });
        return `${date.getDate()} ${monthShort}\n${date.getHours().toString().padStart(2,'0')}:00`;
      }
      return `${date.getUTCHours()}:00`;
    case 'daily':
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    case 'weekly':
      if (timestamp.includes('W')) {
        const [year, week] = timestamp.split('-W');
        return `Week ${week}, ${year}`;
      }
      return timestamp;
    case 'monthly':
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    case 'yearly':
      return date.getFullYear().toString();
    default:
      // For no aggregation or other cases
      return timestamp;
  }
}, [timeRange]);

  // Format chart data with improved styling and aggregation
  const chartData = useMemo(() => {
    if (!historicalData.length) {
      return { labels: [], datasets: [] };
    }
    
    // Apply data aggregation based on selected interval
    const aggregatedData = aggregateData(historicalData, aggregationInterval);

    // Format labels
    const labels = aggregatedData.map(item => {
      if (aggregationInterval !== 'none') {
        return formatLabel(item.Timestamp, aggregationInterval);
      } else {
        const date = new Date(item.Timestamp);
        if (timeRange === 'hour' || timeRange === 'day') {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
    });

    // Enhanced dataset styling
    const datasets = selectedFields.map((field, index) => {
      const fieldInfo = AVAILABLE_FIELDS.find(f => f.field === field);
      // Determine color: user-selected or fallback
       const color = fieldColors[field] || COLOR_PALETTE[index % COLOR_PALETTE.length];
      
      return {
        label: fieldInfo ? fieldInfo.label : field + (aggregationInterval !== 'none' ? ' (Avg)' : ''),
        data: aggregatedData.map(item => item[field]),
        borderColor: color,
        backgroundColor: chartType === 'line' ? `${color}33` : color,
        borderWidth: 2,
        tension: 0.4,
        fill: chartType === 'line' ? (chartTab === 1) : false, // Fill area only in area mode
        pointRadius: chartType === 'line' ? 3 : 0,
        pointHoverRadius: 6
      };
    });

    return { labels, datasets };
  }, [historicalData, selectedFields, chartType, chartTab, timeRange, aggregationInterval, fieldColors]);
  
  // Export data to Excel
  const exportToExcel = () => {
    if (!historicalData.length) return;
    
    // Prepare data for export
    const exportData = historicalData.map(item => {
      const formattedItem = {
        Timestamp: new Date(item.Timestamp).toLocaleString()
      };
      
      // Only include selected fields
      selectedFields.forEach(field => {
        const fieldInfo = AVAILABLE_FIELDS.find(f => f.field === field);
        formattedItem[fieldInfo ? fieldInfo.label : field] = item[field];
      });
      
      return formattedItem;
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Power Monitoring Data');
    
    // Generate filename with current date
    const now = new Date();
    const filename = `power_data_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;
    
    // Save file
    XLSX.writeFile(workbook, filename);
  };

  // Export visible chart & summary to PNG
  const exportToPNG = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'power_monitor_chart.png';
    link.click();
  };

  // Export visible chart & summary to PDF
  const exportToPDF = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('power_monitor_chart.pdf');
  };



  // Calculate summary statistics for each field
  const calculateSummaryStats = useCallback((data) => {
    if (!data.length || !selectedFields.length) return {};

    const stats = {};

    selectedFields.forEach((field) => {
      let sum = 0;
      let count = 0;
      let minVal = Number.POSITIVE_INFINITY;
      let maxVal = Number.NEGATIVE_INFINITY;
      let minTimestamp = null;
      let maxTimestamp = null;

      data.forEach((item) => {
        const val = item[field];
        if (val !== undefined && val !== null && typeof val === 'number' && !isNaN(val)) {
          sum += val;
          count += 1;

          if (val < minVal) {
            minVal = val;
            minTimestamp = item.Timestamp;
          }
          if (val > maxVal) {
            maxVal = val;
            maxTimestamp = item.Timestamp;
          }
        }
      });

      if (count > 0) {
        stats[field] = {
          avg: parseFloat((sum / count).toFixed(2)),
          min: parseFloat(minVal.toFixed(2)),
          minTimestamp,
          max: parseFloat(maxVal.toFixed(2)),
          maxTimestamp,
        };
      }
    });

    return stats;
  }, [selectedFields]);

  // Calculate summary statistics for the dataset currently displayed (raw or aggregated)
  const summaryStats = useMemo(() => {
    if (!historicalData.length) return {};

    const baseData = aggregationInterval !== 'none'
      ? aggregateData(historicalData, aggregationInterval)
      : historicalData;

    return calculateSummaryStats(baseData);
  }, [historicalData, selectedFields, aggregationInterval]);

  // Determine timestamp range of summary dataset
  const summaryTimeRange = useMemo(() => {
    const baseData = aggregationInterval !== 'none'
      ? aggregateData(historicalData, aggregationInterval)
      : historicalData;
    if (!baseData.length) return null;
    return {
      start: baseData[0].Timestamp,
      end: baseData[baseData.length - 1].Timestamp,
    };
  }, [historicalData, aggregationInterval]);

  // Find min and max values for auto scaling the chart
  const getDataBounds = useCallback(() => {
    if (!chartData.datasets || chartData.datasets.length === 0) {
      return { min: 0, max: 100 }; // Default values if no data
    }
    
    let allValues = [];
    chartData.datasets.forEach(dataset => {
      if (dataset.data && Array.isArray(dataset.data)) {
        // Filter out non-numeric values
        const numericValues = dataset.data.filter(val => 
          val !== undefined && val !== null && typeof val === 'number' && !isNaN(val)
        );
        allValues = allValues.concat(numericValues);
      }
    });
    
    if (allValues.length === 0) {
      return { min: 0, max: 100 }; // Default values if no numeric data
    }
    
    const min = allValues.reduce((a,b) => a < b ? a : b, allValues[0]);
    const max = allValues.reduce((a,b) => a > b ? a : b, allValues[0]);
    
    // Add padding (10% of the range) for better visualization
    const range = max - min;
    const padding = range * 0.1;
    
    // If min and max are very close, create some padding
    if (Math.abs(max - min) < 0.0001) {
      return { 
        min: min - (min * 0.1 || 0.1), 
        max: max + (max * 0.1 || 0.1) 
      };
    }
    
    return {
      min: min - padding,
      max: max + padding
    };
  }, [chartData.datasets]);
  
  // We already have chartRef declared at line 123, no need to redeclare

  // Reset zoom function
  // Zoom functionality will be re-implemented with Recharts Brush later
  const resetZoom = () => {}; // no-op for now

  // Enhanced chart options with better styling, auto-scaling and zoom functionality
  const chartOptions = useCallback(() => {
    const { min, max } = getDataBounds();
    
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
                label += context.parsed.y.toFixed(2);
              }
              return label;
            }
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
              // Format the tick values for better readability
              if (Math.abs(value) >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'k';
              }
              return value.toFixed(1);
            }
          },
          border: {
            dash: [4, 4]
          }
        },
        x: {
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            padding: 10,
            font: {
              family: theme.typography.fontFamily
            }
          },
          border: {
            dash: [4, 4]
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      // Enable zooming functionality
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
                label += context.parsed.y.toFixed(2);
              }
              return label;
            }
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'xy'
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
            speed: 100
          }
        }
      }
    };
  }, [theme, getDataBounds, chartData]);

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (selectedFields.length === 0) {
      alert('Please select at least one reading to display.');
      return;
    }
    
    // Map selected timeRange to appropriate backend aggregation interval
    let interval = 'none';
    switch (timeRange) {
      case 'hour': // last hour – average per minute
      case 'day': // today – average per minute
        interval = 'minutely';
        break;
      case 'week': // last week – hourly averages for each day
        interval = 'hourly';
        break;
      case 'month': // monthly view – daily averages
        interval = 'daily';
        break;
      default:
        interval = 'none';
    }

    // Update state so chart knows how to label / aggregate
    setAggregationInterval(interval);
    
    fetchHistoricalData(
      startDate.format('YYYY-MM-DDTHH:mm:ss'),
      endDate.format('YYYY-MM-DDTHH:mm:ss'),
      selectedFields,
      interval
    );
  };

  return (
    <Box className="container">
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Historical Data
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          View and analyze power meter readings over time
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Time Range Selector */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Time Range
              </Typography>
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={handleTimeRangeChange}
                aria-label="time range"
                sx={{ flexWrap: 'wrap', mb: 2 }}
              >
                {TIME_RANGES.map((range) => (
                  <ToggleButton 
                    key={range.value} 
                    value={range.value}
                    aria-label={range.label}
                    sx={{ 
                      px: 2, 
                      py: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1 
                    }}
                  >
                    {range.icon}
                    {range.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Custom Date Range Fields - show only if custom range selected */}
            {showCustomRange && (
              <>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: { fullWidth: true, variant: 'outlined' }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{
                        textField: { fullWidth: true, variant: 'outlined' }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}

            {/* Data Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="readings-select-label">Select Readings</InputLabel>
                <Select
                  labelId="readings-select-label"
                  id="readings-select"
                  multiple
                  value={selectedFields}
                  onChange={handleFieldsChange}
                  input={<OutlinedInput label="Select Readings" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const field = AVAILABLE_FIELDS.find(f => f.field === value);
                        return (
                          <Chip 
                            key={value} 
                            label={field ? field.label : value} 
                            sx={{ borderRadius: '16px' }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {AVAILABLE_FIELDS.map((field) => (
                    <MenuItem key={field.field} value={field.field}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Color Pickers */}
            {selectedFields.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Choose Line Colors
                </Typography>
                <Grid container spacing={2}>
                  {selectedFields.map((field) => {
                    const label = AVAILABLE_FIELDS.find(f => f.field === field)?.label || field;
                    return (
                      <Grid item xs={6} sm={4} md={3} key={field}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ minWidth: 120 }}>
                            {label}
                          </Typography>
                          <input
                            type="color"
                            value={fieldColors[field] || '#000000'}
                            onChange={(e) => handleColorChange(field, e.target.value)}
                            style={{ width: 32, height: 32, border: 'none', padding: 0, background: 'none' }}
                          />
                        </Stack>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            )}

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  sx={{ flexGrow: 1, py: 1.5 }}
                  disabled={isLoading || selectedFields.length === 0}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Fetch Data'}
                </Button>
                {historicalData.length > 0 && (
                  <Tooltip title="Export to Excel">
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={exportToExcel}
                      startIcon={<FileDownloadIcon />}
                      sx={{ py: 1.5 }}
                    >
                      Export
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : historicalData.length > 0 ? (
        <Paper elevation={3} sx={{ p: 3 }} ref={exportRef}>
          {/* Summary Statistics */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Summary Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {/* Statistics cards */}
            <Grid container spacing={2}>
              {Object.entries(summaryStats).map(([field, values]) => (
                <Grid item xs={12} sm={6} md={4} key={field}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {AVAILABLE_FIELDS.find(f => f.field === field)?.label || field}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Avg: {values.avg}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Min: {values.min} {values.minTimestamp ? `@ ${new Date(values.minTimestamp).toLocaleString()}` : ''}
                    </Typography>
                    <Typography variant="body1">
                      Max: {values.max} {values.maxTimestamp ? `@ ${new Date(values.maxTimestamp).toLocaleString()}` : ''}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {/* Time Range */}
            {summaryTimeRange && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Range: {new Date(summaryTimeRange.start).toLocaleString()} – {new Date(summaryTimeRange.end).toLocaleString()}
              </Typography>
            )}











          </Box>

          {/* Chart Controls */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={handleChartTypeChange}
                  size="small"
                  aria-label="chart type"
                >
                  <ToggleButton value="line" aria-label="line chart">
                    <TimelineIcon sx={{ mr: 1 }} /> Line
                  </ToggleButton>
                  <ToggleButton value="bar" aria-label="bar chart">
                    <BarChartIcon sx={{ mr: 1 }} /> Bar
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              {chartType === 'line' && (
                <Grid item>
                  <Tabs
                    value={chartTab}
                    onChange={handleChartTabChange}
                    aria-label="chart style"
                  >
                    <Tab label="Line" />
                    <Tab label="Area" />
                  </Tabs>
                </Grid>
              )}
              
              {/* Data Aggregation Controls */}
              <Grid item>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel id="aggregation-select-label">Summarize Data</InputLabel>
                  <Select
                    labelId="aggregation-select-label"
                    id="aggregation-select"
                    value={aggregationInterval}
                    onChange={(e) => setAggregationInterval(e.target.value)}
                    label="Summarize Data"
                    size="small"
                    IconComponent={ArrowDropDown}
                  >
                    <MenuItem value="none">
                      <ListItemIcon>
                        <InfoOutlined sx={{ color: 'text.secondary' }} />
                      </ListItemIcon>
                      <ListItemText primary="No Summarization" />
                    </MenuItem>
                    <MenuItem value="hourly">
                      <ListItemIcon>
                        <HourglassTopIcon sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Hourly" />
                    </MenuItem>
                    <MenuItem value="daily">
                      <ListItemIcon>
                        <ViewDayIcon sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Daily" />
                    </MenuItem>
                    <MenuItem value="weekly">
                      <ListItemIcon>
                        <ViewWeekIcon sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Weekly" />
                    </MenuItem>
                    <MenuItem value="monthly">
                      <ListItemIcon>
                        <CalendarViewMonthIcon sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Monthly" />
                    </MenuItem>
                    <MenuItem value="yearly">
                      <ListItemIcon>
                        <CalendarMonthIcon sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Yearly" />
                    </MenuItem>

                    </Select>
                  </FormControl>
                </Grid>

                <Grid item sx={{ marginLeft: 'auto' }}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FileDownloadIcon />}
                      onClick={exportToExcel}
                      disabled={!historicalData.length}
                    >
                      Excel
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<ImageIcon />}
                      onClick={exportToPNG}
                      disabled={!historicalData.length}
                    >
                      PNG
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={exportToPDF}
                      disabled={!historicalData.length}
                    >
                      PDF
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            {/* Chart Display */}
            <Box sx={{ height: 500, mb: 2 }}>
              {chartType === 'line' ? (
                <PowerLineChart
                  data={chartData}
                  isLoading={isLoading}
                  isSummarized={aggregationInterval !== 'none'}
                />
              ) : (
                <PowerBarChart
                  data={chartData}
                  isLoading={isLoading}
                  isSummarized={aggregationInterval !== 'none'}
                />
              )}
            </Box>


          {/* Data Info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {historicalData.length} data points | {startDate.format('MMM D, YYYY HH:mm')} - {endDate.format('MMM D, YYYY HH:mm')}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No data to display. Select a time range and readings, then click "Fetch Data".
          </Typography>
        </Paper>
      )}      
    </Box>
  );
};

export default HistoricalData;
