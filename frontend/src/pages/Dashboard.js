import React, { useContext, useMemo, useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card,
  CardContent,
  Divider,
  useTheme,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  InputAdornment, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { DataContext } from '../context/DataContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ChromePicker } from 'react-color';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';


// Settings Button component for gauge configuration
const GaugeSettingsButton = ({ onClick }) => (
  <Tooltip title="Customize Gauge Range">
    <IconButton 
      onClick={onClick} 
      size="small" 
      sx={{ 
        position: 'absolute', 
        top: 8, 
        right: 8,
        zIndex: 1,
        bgcolor: 'rgba(255,255,255,0.2)',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } 
      }}
    >
      <TuneIcon fontSize="small" />
    </IconButton>
  </Tooltip>
);

// Numerical Energy Display component
const EnergyDisplay = ({ value, label, min = 0, max = 1000, unit = 'MWh', decimals = 2, transform = null, denominator = max, onRangeEdit }) => {
  const theme = useTheme();
  
  // Apply transformation if provided
  const processedValue = transform ? transform(value) : value;
  
  // Format the value for display
  let formattedValue = 'N/A';
  let percentage = 0;
  const denominatorVal = typeof denominator === 'number' ? denominator : max;
  if (processedValue !== undefined) {
    if (typeof processedValue === 'number' && !isNaN(processedValue)) {
      formattedValue = processedValue.toFixed(decimals);
      percentage = denominatorVal !== 0 ? Math.max((processedValue / denominatorVal) * 100, 0) : 0;
    } else if (typeof processedValue === 'string') {
      formattedValue = processedValue; // Display string values directly
    } else {
      formattedValue = String(processedValue); // Convert other types to string
    }
  }

  // Energy color based on percentage
  const getEnergyColor = (percent) => {
    if (percent > 80) return '#4CAF50'; // Dark green for high values
    if (percent > 60) return '#8BC34A'; // Light green for medium-high values
    if (percent > 40) return '#CDDC39'; // Lime for medium values
    if (percent > 20) return '#FFD54F'; // Amber for low-medium values
    return '#FFC107'; // Yellow for low values
  };

  const energyColor = getEnergyColor(percentage);
  const isLongUnit = unit && unit.length >= 4;
  // Dynamically adjust font size based on the length of the value string so that long numbers fit within the card
  const valueLength = String(formattedValue).length;
  const dynamicFontSize = valueLength > 12 ? '2rem' : valueLength > 9 ? '3rem' : valueLength > 6 ? '4rem' : '5rem';

  return (
    <Card sx={{ 
      p: 2, 
      height: '100%',
      position: 'relative',
      transition: 'all 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 4
      }
    }}>
      {onRangeEdit && <GaugeSettingsButton onClick={() => onRangeEdit('Energy_Consumption', min, max, unit, denominator)} />}
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ElectricBoltIcon color="success" />
          {label}
        </Typography>
        
        <Box
            sx={{
              py: 2,
              display: 'flex',
              flexDirection: isLongUnit ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: energyColor, fontSize: dynamicFontSize, lineHeight: 1, width: '100%', textAlign: 'center' }}>
              {formattedValue}
            </Typography>
            {unit && (
              <Typography
                variant={isLongUnit ? 'h6' : 'h4'}
                color="text.secondary"
                sx={{ ml: isLongUnit ? 0 : 0.5 }}
              >
                {unit}
              </Typography>
            )}
          </Box>
        
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            sx={{ 
              height: 14, 
              borderRadius: 5,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: energyColor,
                borderRadius: 5
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">{min} {unit}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
            {Math.round(percentage)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">{max} {unit}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Custom Progressive Gauge Component
const ProgressiveGauge = ({
  value,
  label,
  min = 0,
  max = 100,
  unit = '',
  decimals = 1,
  thresholds = [
    { value: 30, color: '#4CAF50' },
    { value: 60, color: '#FFC107' },
    { value: 90, color: '#F44336' }
  ],
  size = 200,
  onRangeEdit,
  field,
  gaugeMin = 0,
  gaugeMax = 100, denominator = gaugeMax, solidColorMode = false
}) => {
  // solidColorMode is controlled globally by Dashboard
  // Calculate percentage
  const denominatorVal = typeof denominator === 'number' ? denominator : max;
  const percentage = denominatorVal !== 0 ? Math.max((value / denominatorVal) * 100, 0) : 0;
  
  // Sort thresholds by value
  const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value);

  // Helper to retrieve the color that should be applied at the current value
// Logic: return the color of the first threshold whose value is GREATER than the current value.
// This mirrors the colour picked for the partial segment in progressive mode.
const thresholdColorForValue = (val) => {
  if (sortedThresholds.length === 0) return '#4CAF50';

  // Iterate thresholds ascending; the first one that exceeds `val` is the active colour.
  for (let i = 0; i < sortedThresholds.length; i++) {
    if (val < parseFloat(sortedThresholds[i].value)) {
      return sortedThresholds[i].color;
    }
  }

  // If the value is >= the highest threshold, use the last threshold's colour.
  return sortedThresholds[sortedThresholds.length - 1].color;
};  

  // SVG dimensions
  const center = size / 2;
  const radius = size * 0.35;
  const strokeWidth = size * 0.08;
  const isLongUnit = unit && unit.length >= 4;
  
  // Calculate arc parameters (semicircle opening from bottom)
  const startAngle = 180; // Start from bottom
  const endAngle = 360; // End at bottom
  const totalDegrees = endAngle - startAngle;
  
  // Convert angle to radians and get coordinates
  const getCoordinates = (angle) => {
    const radian = angle * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    };
  };
  
  // Create path for arc segment
  const createArcPath = (startAngle, endAngle, isLargeArc = false) => {
    const start = getCoordinates(startAngle);
    const end = getCoordinates(endAngle);
    const largeArcFlag = isLargeArc ? 1 : 0;
    const sweepFlag = 1; // Always sweep clockwise
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  };
  
  // Create color segments up to current value
  const createColorSegments = (min, max) => {
    const segments = [];
    let lastAngle = startAngle;
    
    // Calculate angle based on actual value
    const currentAngle = startAngle + ((value - min) / (max - min) * totalDegrees);
    
    // If solidColorMode is active, draw a single colored segment for the progress arc
    if (solidColorMode) {
      segments.push({
        path: createArcPath(startAngle, currentAngle),
        color: thresholdColorForValue(value),
        startAngle: startAngle,
        endAngle: currentAngle
      });
      // Neutral remainder segment to complete the semicircle
      if (currentAngle < endAngle) {
        segments.push({
          path: createArcPath(currentAngle, endAngle),
          color: 'rgba(0,0,0,0.1)',
          startAngle: currentAngle,
          endAngle: endAngle
        });
      }
      return segments;
    }
    
    // Add segments for each threshold up to current value
    let lastThresholdValue = min;
    for (let i = 0; i < sortedThresholds.length; i++) {
      const threshold = sortedThresholds[i];
      const thresholdValue = parseFloat(threshold.value);
      
      // Ensure threshold is within range
      const clampedValue = Math.max(min, Math.min(max, thresholdValue));
      const thresholdAngle = startAngle + ((clampedValue - min) / (max - min) * totalDegrees);
      const thresholdColor = threshold.color;
      
      // Only add segment if it's within the current value
      if (value >= clampedValue) {
        // This segment goes from lastAngle to thresholdAngle
        segments.push({
          path: createArcPath(lastAngle, thresholdAngle),
          color: thresholdColor,
          startAngle: lastAngle,
          endAngle: thresholdAngle
        });
        lastAngle = thresholdAngle;
      } else {
        // Partial segment up to current value
        if (currentAngle > lastAngle) {
          segments.push({
            path: createArcPath(lastAngle, currentAngle),
            color: threshold.color,
            startAngle: lastAngle,
            endAngle: currentAngle
          });
        }
        break;
      }
    }
    
    // If current value exceeds all thresholds, add final segment
    if (lastAngle < currentAngle && value > max) {
      segments.push({
        path: createArcPath(lastAngle, currentAngle),
        color: sortedThresholds[sortedThresholds.length - 1]?.color || '#F44336',
        startAngle: lastAngle,
        endAngle: currentAngle
      });
    }
    
    // Add remaining neutral segment to complete the semicircle
    if (currentAngle < endAngle) {
      segments.push({
        path: createArcPath(currentAngle, endAngle),
        color: 'rgba(0,0,0,0.1)',
        startAngle: currentAngle,
        endAngle: endAngle
      });
    }
    
    return segments;
  };
  
  const colorSegments = createColorSegments(min, max);
  
  // Background arc (full semicircle)
  const backgroundPath = createArcPath(startAngle, endAngle, true);
  
  // Format value for display
  const formattedValue = typeof value === 'number' && !isNaN(value) 
    ? value.toFixed(decimals) 
    : 'N/A';

  const currentThresholdColor = () => thresholdColorForValue(value);

  return (
    <Card sx={{ 
      p: 2, 
      height: '100%',
      position: 'relative',
      transition: 'all 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 4
      }
    }}>
      


      {onRangeEdit && field && <GaugeSettingsButton onClick={() => onRangeEdit(field, gaugeMin, gaugeMax, unit, denominator)} />}
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {label}
        </Typography>
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1.6', mx: 'auto', my: 2 }}>
          <svg viewBox={`0 0 ${size} ${size * 0.65}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Background arc */}
            <path
              d={backgroundPath}
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Color segments */}
            {colorSegments.map((segment, index) => (
              <path
                key={index}
                d={segment.path}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: 'all 0.5s ease-in-out'
                }}
              />
            ))}
            
            {/* Value / Unit / Percentage Text */}
            {isLongUnit ? (
              <>
                {/* Value */}
                <text
                  x={center}
                  y={center}
                  textAnchor="middle"
                  fontSize={size * 0.15}
                  fill={currentThresholdColor()}
                >
                  {formattedValue}
                </text>

                {/* Unit below value */}
                <text
                  x={center}
                  y={center + size * 0.08}
                  textAnchor="middle"
                  fontSize={size * 0.08}
                  fill={currentThresholdColor()}
                >
                  {unit}
                </text>

                {/* Percentage further below */}
                <text
                  x={center}
                  y={center + size * 0.16}
                  textAnchor="middle"
                  fontSize={size * 0.06}
                  fill={currentThresholdColor()}
                >
                  {percentage.toFixed(2)}%
                </text>
              </>
            ) : (
              <>
                {/* Value and short unit inline */}
                <text
                  x={center}
                  y={center}
                  textAnchor="middle"
                  fontSize={size * 0.15}
                  fill={currentThresholdColor()}
                >
                  {formattedValue}{unit}
                </text>

                {/* Percentage */}
                <text
                  x={center}
                  y={center + size * 0.14}
                  textAnchor="middle"
                  fontSize={size * 0.06}
                  fill={currentThresholdColor()}
                >
                  {percentage.toFixed(2)}%
                </text>
              </>
            )}
          </svg>
        </Box>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Range: {min} - {max} {unit}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Enhanced PowerGauge component with color progression on arc
const PowerGauge = ({
  value,
  label,
  min = 0,
  max = 100,
  unit = '',
  decimals = 1,
  transform = null,
  field,
  onRangeEdit,
  colorMode = 'standard',
  thresholds = [],
  showThresholdColors = false,
  gaugeMin = min,
  gaugeMax = max,
  denominator = gaugeMax,
  gaugeUnit = unit, solidColorMode = false
}) => {
  const theme = useTheme();
  
  // Apply transformation if provided
  const processedValue = transform ? transform(value) : value;
  
  // Set thresholds based on colorMode if none provided
  if (thresholds.length === 0) {
    const minVal = parseFloat(gaugeMin);
    const maxVal = parseFloat(gaugeMax);
    
    switch(colorMode) {
      case 'power-factor':
        thresholds = [
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.1), color: '#00BCD4' },
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.3), color: '#03A9F4' },
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.6), color: '#2196F3' }
        ];
        break;
      case 'voltage':
        thresholds = [
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.7), color: '#E1BEE7' },
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.9), color: '#BA68C8' },
          { value: maxVal, color: '#9C27B0' }
        ];
        break;
      case 'current':
        thresholds = [
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.7), color: '#FFB74D' },
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.9), color: '#FFA726' },
          { value: maxVal, color: '#FF9800' }
        ];
        break;
      default:
        thresholds = [
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.3), color: '#4CAF50' },
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.6), color: '#FFC107' },
          { value: Math.min(maxVal, minVal + (maxVal - minVal) * 0.9), color: '#F44336' }
        ];
    }
  }

  return (
    <ProgressiveGauge
      value={processedValue}
      label={label}
      min={min}
      max={max}
      denominator={denominator}
      unit={unit}
      decimals={decimals}
      thresholds={thresholds}
      size={260}
      solidColorMode={solidColorMode}
      onRangeEdit={onRangeEdit}
      field={field}
      gaugeMin={gaugeMin}
      gaugeMax={gaugeMax}
      gaugeUnit={gaugeUnit}
    />
  );
};

export default function Dashboard() {
  const { liveData, timestamp } = useContext(DataContext);
  const [gaugeRanges, setGaugeRanges] = useState({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({ min: 0, max: 100, unit: '', denominator: 100 });
  const [thresholds, setThresholds] = useState([]);
  const [isThresholdEditorOpen, setIsThresholdEditorOpen] = useState(false);
  const [selectedThreshold, setSelectedThreshold] = useState(null);
  const [thresholdColor, setThresholdColor] = useState('#4CAF50');
  const [isAddGaugeDialogOpen, setIsAddGaugeDialogOpen] = useState(false);
  const [selectedAddFields, setSelectedAddFields] = useState([]);
  const [solidColorMode, setSolidColorMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('solidColorMode');
      return savedMode !== null ? JSON.parse(savedMode) : true; // default to solid gauge
    } catch (error) {
      console.error('Error reading solid color mode:', error);
      return true;
    }
  });
  
  const [thresholdValue, setThresholdValue] = useState(0);

  // Load saved ranges from localStorage on component mount
  useEffect(() => {
    try {
      const savedRanges = localStorage.getItem('gaugeRanges');
      if (savedRanges) {
        setGaugeRanges(JSON.parse(savedRanges));
      }
    } catch (error) {
      console.error('Error loading saved gauge ranges:', error);
    }
  }, []);
  
  // Save ranges to localStorage when they change
  useEffect(() => {
    if (Object.keys(gaugeRanges).length > 0) {
      localStorage.setItem('gaugeRanges', JSON.stringify(gaugeRanges));
    }
  }, [gaugeRanges]);

  // Load saved solid color mode preference on component mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('solidColorMode');
      if (savedMode !== null) {
        setSolidColorMode(JSON.parse(savedMode));
      }
    } catch (error) {
      console.error('Error loading solid color mode:', error);
    }
  }, []);

  // Persist solid color mode preference whenever it changes
  useEffect(() => {
    localStorage.setItem('solidColorMode', JSON.stringify(solidColorMode));
  }, [solidColorMode]);
  

  
  // Handler for opening the edit dialog
  const handleOpenEditDialog = (field, min, max, unit, denominator = max) => {
    setEditingField(field);
    setEditValues({ min, max, unit, denominator });
    const gaugeRange = gaugeRanges[field];
    setThresholds(gaugeRange?.thresholds || [
      { value: 30, color: '#4CAF50' },
      { value: 60, color: '#FFC107' },
      { value: 90, color: '#F44336' }
    ]);
    setIsEditDialogOpen(true);
  };
  
  // Handler for saving range changes
  const handleSaveRange = () => {
    if (editingField) {
      // Validate that min is less than max
      const minVal = parseFloat(editValues.min);
      const maxVal = parseFloat(editValues.max);
      
      if (minVal >= maxVal) {
        alert('Minimum value must be less than maximum value');
        return;
      }
      
      // Save thresholds if they exist
      const thresholdsToSave = thresholds.length > 0 ? thresholds : [
        { value: 30, color: '#4CAF50' },
        { value: 60, color: '#FFC107' },
        { value: 90, color: '#F44336' }
      ];
      
      setGaugeRanges(prev => ({
        ...prev,
        [editingField]: { 
          min: minVal, 
          max: maxVal, 
          unit: editValues.unit,
          denominator: parseFloat(editValues.denominator),
          thresholds: thresholdsToSave
        }
      }));
      setIsEditDialogOpen(false);
    }
  };

  // Handler for saving edited threshold
  const handleSaveThreshold = () => {
    const value = parseFloat(thresholdValue);
    const clampedValue = Math.max(parseFloat(editValues.min), Math.min(parseFloat(editValues.max), value));
    
    if (selectedThreshold !== null && thresholds[selectedThreshold]) {
      setThresholds(prev => {
        const newThresholds = [...prev];
        newThresholds[selectedThreshold] = {
          value: clampedValue,
          color: thresholdColor || '#4CAF50' // Default color if none provided
        };
        return newThresholds;
      });
      setSelectedThreshold(null);
    } else {
      // Adding new threshold
      setThresholds(prev => [...prev, { 
        value: clampedValue, 
        color: thresholdColor || '#4CAF50'
      }]);
    }
    setIsThresholdEditorOpen(false);
  };

  // Handler for removing a threshold
  const handleRemoveThreshold = (index) => {
    if (window.confirm('Are you sure you want to remove this threshold?')) {
      setThresholds(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handler for editing a threshold
  const handleEditThreshold = (index) => {
    const threshold = thresholds[index];
    if (!threshold) {
      console.error('Threshold not found at index:', index);
      return;
    }
    
    setThresholdValue(threshold.value);
    setThresholdColor(threshold.color || '#4CAF50'); // Default color if none provided
    setSelectedThreshold(index);
    setIsThresholdEditorOpen(true);
  };

  // Helper function to get thresholds from gauge ranges
  const getThresholds = (field) => {
    const gaugeRange = gaugeRanges[field];
    return gaugeRange?.thresholds || [
      { value: 30, color: '#4CAF50' },
      { value: 60, color: '#FFC107' },
      { value: 90, color: '#F44336' }
    ];
  };
  
  // Format the timestamp for display
  const formattedTimestamp = useMemo(() => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, [timestamp]);

  // Helper function to merge custom ranges with default configurations
  const getConfigWithCustomRanges = (config) => {
    if (!config) return {};
    const customRange = gaugeRanges[config.field];
    return {
      ...config,
      min: customRange?.min ?? config.min,
      max: customRange?.max ?? config.max,
      unit: customRange?.unit ?? config.unit,
      denominator: customRange?.denominator ?? config.denominator ?? config.max
    };
  };

  // Gauge configurations for different meter readings
  const gaugeConfigs = [
    { 
      field: 'Voltage_L_L_Avg', 
      label: 'Voltage L-L Avg', 
      min: 0, 
      max: 1, 
      unit: 'kV',
      decimals: 2,
      colorMode: 'voltage',
      transform: (value) => {
        if (typeof value === 'number' && !isNaN(value)) {
          // Convert volts to kilovolts when value appears to be in volts
          return value > 10 ? value / 1000 : value;
        }
        return value;
      }
    },
    { 
      field: 'Current_Avg', 
      label: 'Current Avg', 
      min: 0, 
      max: 100, 
      unit: 'A',
      decimals: 2,
      colorMode: 'current'
    },
    { 
      field: 'Active_Power_Total', 
      label: 'Active Power', 
      min: 0, 
      max: 50, 
      unit: 'MW',
      decimals: 2,
      // Convert value from W to MW or handle if already in MW
      transform: (value) => {
        if (typeof value === 'number' && !isNaN(value)) {
          // Check if already in MW range or needs conversion
          return value < 1000 ? value : value / 1000000;
        }
        return value;
      }
    },
    { 
      field: 'Reactive_Power_Total', 
      label: 'Reactive Power', 
      min: 0, 
      max: 50, 
      unit: 'MVAR',
      decimals: 2,
      transform: (value) => {
        if (typeof value === 'number' && !isNaN(value)) {
          return value < 1000 ? value : value / 1000000;
        }
        return value;
      }
    },
    { 
      field: 'Apparent_Power_Total', 
      label: 'Apparent Power', 
      min: 0, 
      max: 50, 
      unit: 'MVA',
      decimals: 2,
      transform: (value) => {
        if (typeof value === 'number' && !isNaN(value)) {
          return value < 1000 ? value : value / 1000000;
        }
        return value;
      }
    },
    {
      field: 'Active_Energy',
      label: 'Energy Consumption',
      min: 0,
      max: 1000,
      unit: 'MWh',
      decimals: 2,
      colorMode: 'energy',
      transform: (value) => {
        // Return the value directly as it's already in MWh
        return value;
      }
    },
    { 
      field: 'Power_Factor_Total', 
      label: 'Power Factor', 
      min: 0, 
      max: 1,
      colorMode: 'power-factor',
      // Special handler for power factor which may contain strings and numbers
      transform: (value) => {
        if (typeof value === 'number' && !isNaN(value)) {
          return value;
        } else if (typeof value === 'string') {
          // Try to parse string as number if possible
          const parsed = parseFloat(value);
          return !isNaN(parsed) ? parsed : value;
        }
        return value;
      }, 
      unit: '',
      decimals: 2
    },
    { 
      field: 'Frequency', 
      label: 'Frequency', 
      min: 45, 
      max: 65, 
      unit: 'Hz',
      decimals: 1
    },
    { 
      field: 'THD_Voltage_L_L', 
      label: 'THD Voltage', 
      min: 0, 
      max: 10, 
      unit: '%',
      decimals: 2
    }
  ];

  // === Dynamic list of ALL readings ===
  const allGaugeFields = useMemo(() => {
    if (liveData && typeof liveData === 'object') {
      return Object.keys(liveData);
    }
    return gaugeConfigs.map(cfg => cfg.field);
  }, [liveData]);

  const getConfigForField = (field) => {
    const predefined = gaugeConfigs.find(cfg => cfg.field === field);
    if (predefined) {
      return getConfigWithCustomRanges(predefined);
    }
    // Voltage-specific fallback if field name contains 'Voltage'
    const lower = field.toLowerCase();
    if (lower.includes('voltage')) {
      return getConfigWithCustomRanges({
        field,
        label: field.replace(/_/g, ' '),
        min: 0,
        max: 1,
        unit: 'kV',
        decimals: 2,
        colorMode: 'voltage',
        transform: (value) => {
          if (typeof value === 'number' && !isNaN(value)) {
            // Convert volts to kilovolts when the raw value appears to be in volts
            return value > 10 ? value / 1000 : value;
          }
          return value;
        }
      });
    }

    // Generic fallback config for any undefined reading
    return getConfigWithCustomRanges({
      field,
      label: field.replace(/_/g, ' '),
      min: 0,
      max: 100,
      unit: '',
      decimals: 2,
      colorMode: 'standard'
    });
    };

  // === Drag & Drop support for gauges ===
  const [displayedFields, setDisplayedFields] = useState(() => {
    try {
      const saved = localStorage.getItem('displayedFields');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading saved displayed fields:', err);
    }
    return gaugeConfigs.filter(cfg => cfg.field !== 'Active_Energy').map(cfg => cfg.field);
  });

  // List of readings not currently displayed (excluding Active_Energy)
  const availableGaugeFields = useMemo(
    () => allGaugeFields.filter(field => !displayedFields.includes(field) && field !== 'Active_Energy'),
    [allGaugeFields, displayedFields]
  );

  // Persist displayedFields whenever they change
  useEffect(() => {
    if (displayedFields && displayedFields.length > 0) {
      localStorage.setItem('displayedFields', JSON.stringify(displayedFields));
    }
  }, [displayedFields]);

  const handleAddGauge = () => {
    if (selectedAddFields.length > 0) {
      setDisplayedFields(prev => [...prev, ...selectedAddFields.filter(f => !prev.includes(f))]);
      setIsAddGaugeDialogOpen(false);
      setSelectedAddFields([]);
    }
  };

  const handleDragStart = (e, field) => {
    e.dataTransfer.setData('text/plain', field);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetField) => {
    e.preventDefault();
    const sourceField = e.dataTransfer.getData('text/plain');
    if (!sourceField) return;

    setDisplayedFields((prev) => {
      const newOrder = [...prev];

      // If dragging in from available list
      if (!newOrder.includes(sourceField)) {
        const targetIndex = newOrder.indexOf(targetField);
        newOrder.splice(targetIndex + 1, 0, sourceField);
        return newOrder;
      }

      const sourceIndex = newOrder.indexOf(sourceField);
      const targetIndex = newOrder.indexOf(targetField);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return newOrder;

      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceField);
      return newOrder;
    });
  };

  const handleContainerDrop = (e) => {
    e.preventDefault();
    const sourceField = e.dataTransfer.getData('text/plain');
    if (!sourceField) return;
    setDisplayedFields((prev) => (prev.includes(sourceField) ? prev : [...prev, sourceField]));
  };

  const handleRemoveGauge = (field) => {
    setDisplayedFields((prev) => prev.filter((f) => f !== field));
  };

  return (
    <Box className="container">
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Power Monitor Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Live readings from power meter
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1">
          <strong>Last Update:</strong> {formattedTimestamp}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setIsAddGaugeDialogOpen(true)}
          >
            Add Gauge
          </Button>
          <Tooltip title={solidColorMode ? 'Switch to progressive colors' : 'Switch to solid color'}>
            <IconButton onClick={() => setSolidColorMode(prev => !prev)} size="small">
              <PaletteIcon />
            </IconButton>
          </Tooltip>
          
        </Box>
      </Paper>

      <div className="gauge-container" style={{ display: 'flex', gap: '16px' }} onDragOver={handleDragOver} onDrop={handleContainerDrop}>
        {!liveData ? (
          <Typography variant="h5" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            Loading live data...
          </Typography>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {/* Energy Consumption uses the numerical display */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              {(() => {
                const energyConfig = getConfigWithCustomRanges(
                  gaugeConfigs.find(config => config.field === 'Active_Energy')
                );
                return (
                  <EnergyDisplay
                    value={liveData['Active_Energy']}
                    label="Energy Consumption"
                    min={energyConfig.min}
                    max={energyConfig.max}
                    denominator={energyConfig.denominator ?? energyConfig.max}
                    unit={energyConfig.unit}
                    decimals={energyConfig.decimals}
                    transform={energyConfig.transform}
                    onRangeEdit={handleOpenEditDialog}
                  />
                );
              })()}
            </Grid>
            
            {/* Draggable Power Gauges */}
            {displayedFields.map((field) => {
              const config = getConfigForField(field);
              const customConfig = config;
              const gaugeThresholds = getThresholds(config.field);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={field}>
                  <Box
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, field)}
                    sx={{ position: 'relative' }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveGauge(field)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        zIndex: 1,
                        bgcolor: 'rgba(255,255,255,0.7)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <PowerGauge
                      value={liveData[config.field]}
                      label={config.label}
                      min={customConfig.min}
                      max={customConfig.max}
                      unit={customConfig.unit}
                      decimals={customConfig.decimals}
                      transform={customConfig.transform}
                      field={config.field}
                      onRangeEdit={handleOpenEditDialog}
                      colorMode={config.field.toLowerCase().includes('voltage') ? 'voltage' :
                               config.field.toLowerCase().includes('current') ? 'current' :
                               config.field.toLowerCase().includes('power_factor') ? 'power-factor' : 'standard'}
                      thresholds={gaugeThresholds}
                      gaugeMin={customConfig.min}
                      gaugeMax={customConfig.max}
                      gaugeUnit={customConfig.unit}
                      denominator={customConfig.denominator ?? customConfig.max}
                      solidColorMode={solidColorMode}
                    />
                  </Box>
                </Grid>
              );
            })}

          </Grid>
      
        )}
       </div>

      {/* Dialog for customizing gauge ranges */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Customize Gauge Range</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Minimum Value"
              type="number"
              value={editValues.min}
              onChange={(e) => setEditValues({ ...editValues, min: e.target.value })}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">{editValues.unit}</InputAdornment>,
              }}
            />
            <TextField
              label="Maximum Value"
              type="number"
              value={editValues.max}
              onChange={(e) => setEditValues({ ...editValues, max: e.target.value })}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">{editValues.unit}</InputAdornment>,
              }}
            />
            <TextField
              label="Denominator"
              type="number"
              value={editValues.denominator}
              onChange={(e) => setEditValues({ ...editValues, denominator: e.target.value })}
              fullWidth
              margin="normal"
              helperText={`Value that represents 100% on the gauge`}
              InputProps={{
                endAdornment: <InputAdornment position="end">{editValues.unit}</InputAdornment>,
              }}
            />
            <TextField
              label="Unit"
              value={editValues.unit}
              onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
              fullWidth
              margin="normal"
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Thresholds
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {thresholds.map((threshold, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: '1px solid rgba(0,0,0,0.12)'
                    }}
                  >
                    <Typography variant="body2">
                      {threshold.value} {editValues.unit}
                    </Typography>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: threshold.color,
                        boxShadow: 1
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditThreshold(index)}
                        sx={{ p: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveThreshold(index)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    placeholder={`Enter value (${editValues.unit})`}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{editValues.unit}</InputAdornment>,
                    }}
                    helperText={`Value must be between ${editValues.min} and ${editValues.max} ${editValues.unit}`}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setThresholdValue('');
                      setThresholdColor('#4CAF50');
                      setSelectedThreshold(null);
                      setIsThresholdEditorOpen(true);
                    }}
                    startIcon={<AddIcon />}
                  >
                    Add Threshold
                  </Button>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <ChromePicker
                    color={thresholdColor}
                    onChange={(color) => setThresholdColor(color.hex)}
                    width={200}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveRange}
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Gauge Dialog */}
      <Dialog open={isAddGaugeDialogOpen} onClose={() => setIsAddGaugeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Gauge</DialogTitle>
        <DialogContent>
          {availableGaugeFields.length === 0 ? (
            <Typography>No more available readings.</Typography>
          ) : (
            <FormControl fullWidth margin="normal">
              <InputLabel id="add-gauge-select-label">Select Reading</InputLabel>
              <Select
                multiple
                labelId="add-gauge-select-label"
                value={selectedAddFields}
                label="Select Reading"
                onChange={(e) => setSelectedAddFields(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              >
                {availableGaugeFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {getConfigForField(field).label || field.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
    
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddGaugeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={selectedAddFields.length === 0} onClick={handleAddGauge}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Threshold Editor Dialog */}
      <Dialog open={isThresholdEditorOpen} onClose={() => setIsThresholdEditorOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{selectedThreshold !== null ? 'Edit Threshold' : 'Add New Threshold'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              size="small"
              fullWidth
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
              placeholder={`Enter value (${editValues.unit})`}
              InputProps={{
                endAdornment: <InputAdornment position="end">{editValues.unit}</InputAdornment>,
              }}
              helperText={`Value must be between ${editValues.min} and ${editValues.max} ${editValues.unit}`}
            />
            <Box sx={{ width: '100%' }}>
              <ChromePicker
                color={thresholdColor}
                onChange={(color) => setThresholdColor(color.hex)}
                width={200}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsThresholdEditorOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveThreshold}
          >
            {selectedThreshold !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
