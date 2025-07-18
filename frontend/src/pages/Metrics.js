// Metrics.js

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Box, Paper, Typography, Button, Menu, MenuItem, IconButton } from '@mui/material';

import GaugeGrid from '../components/GaugeGrid';
import BiPieChart from '../components/BiPieChart';
import ConfigurablePieCard from '../components/ConfigurablePieCard';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import AddIcon from '@mui/icons-material/Add';
import { DataContext } from '../context/DataContext';

const ResponsiveGridLayout = WidthProvider(Responsive); // Assuming DataContext is globally accessible or passed

// Function to parse units from the units.txt content
const parseUnits = (unitsText) => {
  const unitsMap = {};
  const lines = unitsText.split('\n').filter(line => line.trim() !== '' && !line.startsWith('---'));
  lines.forEach(line => {
    // Remove citation artifacts like '' from the line
    const cleanedLine = line.replace(/'/g, '').trim();
    const parts = cleanedLine.split('|').map(part => part.trim());
    if (parts.length === 2 && parts[0]) {
      unitsMap[parts[0]] = parts[1] || '';
    }
  });
  return unitsMap;
};

// Content of units.txt
const unitsTxtContent = `Measurement Title                     | Unit
-------------------------------------|------
Current_A                            | A
Current_B                            | A
Current_C                            | A
Current_N                            | A
Current_Avg                          | A
Voltage_A_B                          | V
Voltage_B_C                          | V
Voltage_C_A                          | V
Voltage_A_N                          | V
Voltage_B_N                          | V
Voltage_C_N                          | V
Voltage_L_L_Avg                      | V
Voltage_L_N_Avg                      | V
Active_Power_A                       | MW
Active_Power_B                       | MW
Active_Power_C                       | MW
Active_Power_Total                   | MW
Reactive_Power_A                     | MVAR
Reactive_Power_B                     | MVAR
Reactive_Power_C                     | MVAR
Reactive_Power_Total                 | MVAR
Apparent_Power_A                     | MVA
Apparent_Power_B                     | MVA
Apparent_Power_C                     | MVA
Apparent_Power_Total                 | MVA
Power_Factor_Total                   |
Frequency                            | Hz
Active_Energy                        | MWh
Apparent_Energy                      | MVAh
Reactive_Energy_D_R                  | MVARh
THD_Current_A                        | %
THD_Current_B                        | %
THD_Current_C                        | %
THD_Current_N                        | %
THD_Voltage_A_B                      | %
THD_Voltage_B_C                      | %
THD_Voltage_C_A                      | %
THD_Voltage_L_L                      | %
THD_Voltage_A_N                      | %
THD_Voltage_B_N                      | %
THD_Voltage_C_N                      | %
THD_Voltage_L_N                      | %
Voltage_Unbalance_A_B                | %
Voltage_Unbalance_B_C                | %
Voltage_Unbalance_C_A                | %
Voltage_Unbalance_A_N                | %
Voltage_Unbalance_B_N                | %
Voltage_Unbalance_C_N                | %`;

// Default gauges shown when the page first loads. Users can still add/remove afterwards.
const importantFields = [
  'Active_Power_Total',
  'Current_Avg',
  'Voltage_L_L_Avg',
  'Power_Factor_Total',
  'Frequency',
  'Active_Energy',
];

const Metrics = () => {
  const { historicalData, liveData } = useContext(DataContext); // Access live and historical data from context
  const [liveReadings, setLiveReadings] = useState([]);
  const [editMode, setEditMode] = useState(false);
  // --- BI chart selection ---
  const chartDefs = [
    {
      title: 'Phase Currents (A)',
      parts: ['Current_A', 'Current_B', 'Current_C', 'Current_Avg'],
      unit: 'A',
    },
    {
      title: 'Phase Voltages L-L (kV)',
      parts: ['Voltage_A_B', 'Voltage_B_C', 'Voltage_C_A', 'Voltage_L_L_Avg'],
      unit: 'kV',
    },
    {
      title: 'Phase Voltages L-N (kV)',
      parts: ['Voltage_A_N', 'Voltage_B_N', 'Voltage_C_N', 'Voltage_L_N_Avg'],
      unit: 'kV',
    },
    {
      title: 'Active Power (MW)',
      parts: ['Active_Power_A', 'Active_Power_B', 'Active_Power_C', 'Active_Power_Total'],
      unit: 'MW',
    },
    {
      title: 'Reactive Power (MVAR)',
      parts: ['Reactive_Power_A', 'Reactive_Power_B', 'Reactive_Power_C', 'Reactive_Power_Total'],
      unit: 'MVAR',
    },
    {
      title: 'Apparent Power (MVA)',
      parts: ['Apparent_Power_A', 'Apparent_Power_B', 'Apparent_Power_C', 'Apparent_Power_Total'],
      unit: 'MVA',
    },
    {
      title: 'THD Voltage L-L (%)',
      parts: ['THD_Voltage_A_B', 'THD_Voltage_B_C', 'THD_Voltage_C_A', 'THD_Voltage_L_L'],
      unit: '%',
    },
    {
      title: 'THD Voltage L-N (%)',
      parts: ['THD_Voltage_A_N', 'THD_Voltage_B_N', 'THD_Voltage_C_N', 'THD_Voltage_L_N'],
      unit: '%',
    },
    {
      title: 'THD Current (%)',
      parts: ['THD_Current_A', 'THD_Current_B', 'THD_Current_C'],
      unit: '%',
    },
    {
      title: 'Voltage Unbalance L-L (%)',
      parts: ['Voltage_Unbalance_A_B', 'Voltage_Unbalance_B_C', 'Voltage_Unbalance_C_A'],
      unit: '%',
    },
    {
      title: 'Voltage Unbalance L-N (%)',
      parts: ['Voltage_Unbalance_A_N', 'Voltage_Unbalance_B_N', 'Voltage_Unbalance_C_N'],
      unit: '%',
    },
  ];
  const [visibleCharts, setVisibleCharts] = useState(() => {
    try {
      const saved = localStorage.getItem('visibleCharts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((t) => chartDefs.some((c) => c.title === t));
      }
    } catch (err) {
      console.error('Error loading saved visible charts:', err);
    }
    return chartDefs.map((c) => c.title);
  });
  const [pieLayout, setPieLayout] = useState([]);
  const [chartAnchor, setChartAnchor] = useState(null);
  const openChartMenu = (e) => setChartAnchor(e.currentTarget);
  const closeChartMenu = () => setChartAnchor(null);
  const toggleChart = (title) => {
    setVisibleCharts((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };
  useEffect(() => {
    localStorage.setItem('visibleCharts', JSON.stringify(visibleCharts));
  }, [visibleCharts]);
  
  const [resetKey, setResetKey] = useState(0);
  const unitsMap = useMemo(() => parseUnits(unitsTxtContent), []);

  useEffect(() => {
    // Obtain live readings from liveData only to avoid mixing with historical selections
    const extractLiveReadings = () => {
      if (liveData && Object.keys(liveData).length > 0) {
        const readings = Object.entries(liveData).filter(([key]) => key !== 'Timestamp' && key !== 'Current_N' && !key.includes('avg_suffix') && unitsMap[key] !== undefined);
        setLiveReadings(readings);
      }
    };

    extractLiveReadings();
    const intervalId = setInterval(extractLiveReadings, 5000); // refresh every 5 s

    return () => clearInterval(intervalId);
  }, [liveData]);

  // Define example min/max and thresholds for different types of measurements
  const getGaugeProps = (field, value) => {
    // If value is a string like "0.95 lagging" or "leading 0.92", extract the numeric part
    if (typeof value === 'string') {
      const match = value.match(/[-+]?\d*\.?\d+/);
      value = match ? parseFloat(match[0]) : 0;
    }
    let unit = unitsMap[field] || '';
    let minValue = 0;
    let maxValue = 100; // Default max value
    let thresholds = [];

    // Customize min/max and thresholds based on the field type
    if (field.startsWith('Current')) {
      const baseValue = value || 100; // Default to 100 if value is 0 or undefined
      maxValue = Math.max(200, Math.ceil(baseValue * 1.5)); // At least 200, or 1.5x the current value if higher
      const threshold1 = Math.min(maxValue * 0.25, 50);
      const threshold2 = Math.min(maxValue * 0.5, 100);
      const threshold3 = Math.min(maxValue * 0.75, 150);
      thresholds = [
        { value: threshold1, color: '#10b981', name: 'Normal', id: 1 },
        { value: threshold2, color: '#f59e0b', name: 'High', id: 2 },
        { value: threshold3, color: '#ef4444', name: 'Critical', id: 3 },
      ];
    } else if (field.startsWith('Voltage')) {
      // If the value looks like raw volts (> 1000), convert to kV for display
      if (value > 1000) {
        value = value / 1000;
        unit = 'kV';
      }
      const nominal = value; // assume current reading ~ nominal
      minValue = 0;
      maxValue = Math.ceil(nominal * 1.2);
      thresholds = [
        { value: nominal * 0.9, color: '#ef4444', name: 'Low', id: 1 },
        { value: nominal * 1.05, color: '#10b981', name: 'Normal', id: 2 },
        { value: nominal * 1.1, color: '#f59e0b', name: 'High', id: 3 },
        { value: nominal * 1.15, color: '#ef4444', name: 'Critical', id: 4 },
      ];
    } else if (field.includes('Power_Factor')) {
      minValue = 0;
      maxValue = 1;
      thresholds = [
        { value: 0.8, color: '#ef4444', name: 'Low', id: 1 },
        { value: 0.9, color: '#f59e0b', name: 'Warning', id: 2 },
        { value: 0.95, color: '#10b981', name: 'Good', id: 3 },
      ];
    } else if (field.includes('Energy')) {
      minValue = 0;
      const magnitude = Math.pow(10, Math.floor(Math.log10(value || 1)));
      maxValue = Math.max(100, Math.ceil(value / magnitude) * magnitude);
      thresholds = [
        { value: maxValue * 0.2, color: '#10b981', name: 'Low', id: 1 },
        { value: maxValue * 0.5, color: '#f59e0b', name: 'Medium', id: 2 },
        { value: maxValue * 0.8, color: '#ef4444', name: 'High', id: 3 },
      ];
    } else if (field.includes('Power')) {
      maxValue = 10; // Example for MW, MVAR, MVA
      thresholds = [
        { value: 2, color: '#10b981', name: 'Low', id: 1 },
        { value: 5, color: '#f59e0b', name: 'Medium', id: 2 },
        { value: 8, color: '#ef4444', name: 'High', id: 3 },
      ];
    } else if (field.startsWith('THD')) {
         // THD is percentage, adapt range based on observed value
         maxValue = value > 10 ? Math.ceil(value * 1.2) : 10;
         thresholds = [
           { value: maxValue * 0.2, color: '#10b981', name: 'Low', id: 1 },
           { value: maxValue * 0.5, color: '#f59e0b', name: 'Medium', id: 2 },
           { value: maxValue * 0.8, color: '#ef4444', name: 'High', id: 3 },
         ];
    } else if (field === 'Frequency') {
        minValue = 45;
        maxValue = 65;
        thresholds = [
            { value: 48, color: '#ef4444', name: 'Low', id: 1 },
            { value: 50, color: '#10b981', name: 'Normal', id: 2 },
            { value: 60, color: '#10b981', name: 'Normal', id: 3 }, // Assuming 50/60 Hz systems
            { value: 62, color: '#ef4444', name: 'High', id: 4 },
        ];
    }


    // Ensure the current value is within min/max bounds for the gauge
    const boundedValue = Math.max(minValue, Math.min(value, maxValue));

    return {
      value: boundedValue,
      minValue,
      maxValue,
      thresholds,
      unit,
    };
  };

  return (
    <Box className="container" sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Live Metrics
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Real-time power meter readings
        </Typography>
      </Paper>

      {/* Controls */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button variant={editMode ? 'contained' : 'outlined'} size="small" onClick={() => setEditMode((m) => !m)}>
          {editMode ? 'Done' : 'Edit'}
        </Button>
        <Button variant="outlined" size="small" sx={{ mr:1 }} onClick={() => { localStorage.removeItem('gaugeLayout'); setResetKey(Date.now()); }}>
          Auto Size
        </Button>
        <Button variant="outlined" size="small" onClick={openChartMenu} title="Select BI Charts">
          Pie Chart
        </Button>
        <Menu anchorEl={chartAnchor} open={Boolean(chartAnchor)} onClose={closeChartMenu}>
          {chartDefs.map(({ title }) => (
            <MenuItem key={title} onClick={() => toggleChart(title)}>
              <input type="checkbox" checked={visibleCharts.includes(title)} readOnly style={{ marginRight: 6 }} />
              {title}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Gauge dashboard */}
      {/* Gauges */}
{liveReadings.length > 0 ? (
        <GaugeGrid
            readings={liveReadings}
            getGaugeProps={getGaugeProps}
            editMode={editMode}
            resetKey={resetKey}
            initialVisible={importantFields}
          />
      ) : (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No live data available.
          </Typography>
        </Paper>
      )}
      {/* BI Pie Cards Grid */}
      {liveReadings.length > 0 && visibleCharts.length > 0 && (
        (() => {
          const readingMap = Object.fromEntries(liveReadings);
          const cards = chartDefs.filter(({ title }) => visibleCharts.includes(title));
          // Arrange pie charts in a consistent 3-column grid (4 rows high per item)
          const itemsPerRow = 3;
          const colWidth = 12 / itemsPerRow; // = 4 columns
          const layout = cards.map((c, idx) => ({
            i: c.title,
            x: (idx % itemsPerRow) * colWidth,
            y: Math.floor(idx / itemsPerRow) * 4, // place each row beneath the previous
            w: colWidth,
            h: 4,
            minW: colWidth,
            minH: 4,
          }));
          return (
            <Box sx={{ mt: 4 }}>
              <ResponsiveGridLayout
                isDraggable={editMode}
                isResizable={editMode}
                layouts={{ lg: layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={50}
              >
                {cards.map(({ title, parts, unit }) => (
                  <div key={title} data-grid={layout.find((l)=>l.i===title)}>
                    <ConfigurablePieCard
                      id={`pie-${title}`}
                      title={title}
                      phaseLabels={parts.slice(0,3).map((p) => p ? p.replace(/.*?_/, '') : '')}
                      phaseValues={(title.includes('Voltages') ? parts.slice(0,3).map((p)=> (readingMap[p] ?? null)/1000) : parts.slice(0,3).map((p)=> readingMap[p] ?? null))}
                      compareLabel={parts[3] ? parts[3].replace(/.*?_/, '') : undefined}
                      compareValue={title.includes('Voltages') ? (readingMap[parts[3]] ?? null)/1000 : (readingMap[parts[3]] ?? null)}
                      unit={unit}
                      defaultColors={['#3b82f6', '#8b5cf6', '#f472b6']}
                      editMode={editMode}
                      onRemove={() => toggleChart(title)}
                    />
                  </div>
                ))}
              </ResponsiveGridLayout>
            </Box>
          );
        })()
      )}










                    
    </Box>
  );
};

export default Metrics;