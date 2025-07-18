import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Stack,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ClearIcon from '@mui/icons-material/Clear';
import { DataContext } from '../context/DataContext';

// Available fields for alarms with units
const AVAILABLE_FIELDS = [
  { field: 'Current_A', label: 'Current A', unit: 'A' },
  { field: 'Current_B', label: 'Current B', unit: 'A' },
  { field: 'Current_C', label: 'Current C', unit: 'A' },
  { field: 'Current_N', label: 'Current N', unit: 'A' },
  { field: 'Current_Avg', label: 'Current Avg', unit: 'A' },
  { field: 'Voltage_A_B', label: 'Voltage A-B', unit: 'V' },
  { field: 'Voltage_B_C', label: 'Voltage B-C', unit: 'V' },
  { field: 'Voltage_C_A', label: 'Voltage C-A', unit: 'V' },
  { field: 'Voltage_L_L_Avg', label: 'Voltage L-L Avg', unit: 'V' },
  { field: 'Voltage_L_N_Avg', label: 'Voltage L-N Avg', unit: 'V' },
  { field: 'Active_Power_Total', label: 'Active Power Total', unit: 'W' },
  { field: 'Reactive_Power_Total', label: 'Reactive Power Total', unit: 'VAR' },
  { field: 'Apparent_Power_Total', label: 'Apparent Power Total', unit: 'VA' },
  { field: 'Power_Factor_Total', label: 'Power Factor', unit: '' },
  { field: 'Frequency', label: 'Frequency', unit: 'Hz' },
  { field: 'THD_Voltage_L_L', label: 'THD Voltage L-L', unit: '%' },
  { field: 'THD_Current_A', label: 'THD Current A', unit: '%' },
  { field: 'THD_Current_B', label: 'THD Current B', unit: '%' },
  { field: 'THD_Current_C', label: 'THD Current C', unit: '%' }
];

const AlarmSettings = () => {
  const { alarmSettings, saveAlarmSettings, activeAlarms, clearAlarms } = useContext(DataContext);
  
  // State for new alarm
  const [newAlarm, setNewAlarm] = useState({
    readingField: '',
    threshold: '',
    condition: 'greater'
  });
  
  // State for alarms list
  const [alarms, setAlarms] = useState([]);
  
  // Load existing alarm settings
  useEffect(() => {
    if (alarmSettings.length > 0) {
      setAlarms(alarmSettings);
    }
  }, [alarmSettings]);
  
  // Handle input changes for new alarm
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewAlarm({
      ...newAlarm,
      [name]: name === 'threshold' ? parseFloat(value) || '' : value
    });
  };
  
  // Add new alarm to the list
  const handleAddAlarm = () => {
    if (!newAlarm.readingField || newAlarm.threshold === '') {
      alert('Please select a reading and enter a threshold value');
      return;
    }
    
    const updatedAlarms = [...alarms, newAlarm];
    setAlarms(updatedAlarms);
    saveAlarmSettings(updatedAlarms);
    
    // Reset form
    setNewAlarm({
      readingField: '',
      threshold: '',
      condition: 'greater'
    });
  };
  
  // Remove alarm from the list
  const handleRemoveAlarm = (index) => {
    const updatedAlarms = alarms.filter((_, i) => i !== index);
    setAlarms(updatedAlarms);
    saveAlarmSettings(updatedAlarms);
  };
  
  // Save all alarm settings
  const handleSaveAlarms = () => {
    saveAlarmSettings(alarms);
  };
  
  // Find field info by field name
  const getFieldInfo = (fieldName) => {
    return AVAILABLE_FIELDS.find(field => field.field === fieldName) || { label: fieldName, unit: '' };
  };

  return (
    <Box className="container">
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Alarm Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure alerts for power readings outside normal ranges
        </Typography>
      </Paper>
      
      {activeAlarms.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 3, backgroundColor: '#fff9c4' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsActiveIcon color="error" sx={{ mr: 1 }} />
              Active Alarms ({activeAlarms.length})
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<ClearIcon />}
              onClick={clearAlarms}
            >
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {activeAlarms.map((alarm, index) => {
              const fieldInfo = getFieldInfo(alarm.readingField);
              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="error" gutterBottom>
                        {fieldInfo.label}
                      </Typography>
                      <Typography variant="h6">
                        {alarm.currentValue.toFixed(2)} {fieldInfo.unit}
                      </Typography>
                      <Chip 
                        label={`Threshold: ${alarm.condition === 'greater' ? '>' : '<'} ${alarm.threshold} ${fieldInfo.unit}`}
                        color="error"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {new Date(alarm.timestamp).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Alarm
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel id="reading-select-label">Select Reading</InputLabel>
                <Select
                  labelId="reading-select-label"
                  id="reading-select"
                  name="readingField"
                  value={newAlarm.readingField}
                  onChange={handleInputChange}
                  label="Select Reading"
                >
                  {AVAILABLE_FIELDS.map((field) => (
                    <MenuItem key={field.field} value={field.field}>
                      {field.label} {field.unit ? `(${field.unit})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel id="condition-select-label">Condition</InputLabel>
                <Select
                  labelId="condition-select-label"
                  id="condition-select"
                  name="condition"
                  value={newAlarm.condition}
                  onChange={handleInputChange}
                  label="Condition"
                >
                  <MenuItem value="greater">Greater than</MenuItem>
                  <MenuItem value="less">Less than</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Threshold Value"
                type="number"
                name="threshold"
                value={newAlarm.threshold}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  endAdornment: newAlarm.readingField ? 
                    getFieldInfo(newAlarm.readingField).unit : ''
                }}
              />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddAlarm}
                fullWidth
              >
                Add Alarm
              </Button>
            </Stack>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Current Alarm Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {alarms.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No alarms configured. Add alarms to receive notifications when readings exceed thresholds.
              </Alert>
            ) : (
              <List>
                {alarms.map((alarm, index) => {
                  const fieldInfo = getFieldInfo(alarm.readingField);
                  return (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem>
                        <ListItemText
                          primary={fieldInfo.label}
                          secondary={
                            <Typography component="span" variant="body2" color="text.primary">
                              {alarm.condition === 'greater' ? 'Greater than' : 'Less than'} {alarm.threshold} {fieldInfo.unit}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemoveAlarm(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            )}
            
            {alarms.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSaveAlarms}
                fullWidth
                sx={{ mt: 2 }}
              >
                Save Settings
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AlarmSettings;
