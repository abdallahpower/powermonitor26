import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

// Create context
export const DataContext = createContext();

// API URL
const API_URL = 'http://localhost:5000/api';

// Socket.io setup
const socket = io('http://localhost:5000');

export const DataProvider = ({ children }) => {
  // State for live data
  const [liveData, setLiveData] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  
  // State for historical data
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for alarms
  const [alarmSettings, setAlarmSettings] = useState([]);
  const [activeAlarms, setActiveAlarms] = useState([]);

  // Connect to socket and setup listeners
  useEffect(() => {
    // Listen for live data updates
    socket.on('liveData', (data) => {
      setLiveData(data);
      setTimestamp(new Date().toISOString());
    });

    // Listen for alarm notifications
    socket.on('alarms', (alarms) => {
      setActiveAlarms((prevAlarms) => [...prevAlarms, ...alarms]);
      
      // Show toast notification for each alarm
      alarms.forEach(alarm => {
        toast.error(
          `Alarm: ${alarm.readingField} value ${alarm.currentValue} has exceeded threshold ${alarm.threshold}`,
          { position: "top-right", autoClose: 5000 }
        );
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off('liveData');
      socket.off('alarms');
    };
  }, []);

  // Fetch latest data
  const fetchLatestData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/latest`);
      setLiveData(response.data);
    } catch (error) {
      console.error('Error fetching latest data:', error);
      toast.error('Failed to fetch latest data');
    }
  }, []);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async (startDate, endDate, fields, aggregationInterval = 'none') => {
    if (!startDate || !endDate || !fields || !fields.length) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/historical`, {
        params: {
          startDate,
          endDate,
          fields: fields.join(','),
          aggregationInterval
        }
      });
      setHistoricalData(response.data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      toast.error('Failed to fetch historical data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save alarm settings
  const saveAlarmSettings = useCallback(async (settings) => {
    try {
      await axios.post(`${API_URL}/alarms`, { settings });
      setAlarmSettings(settings);
      toast.success('Alarm settings saved successfully');
    } catch (error) {
      console.error('Error saving alarm settings:', error);
      toast.error('Failed to save alarm settings');
    }
  }, []);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchLatestData();
  }, [fetchLatestData]);

  // Clear active alarms
  const clearAlarms = () => {
    setActiveAlarms([]);
  };

  // Context value
  const value = {
    liveData,
    timestamp,
    historicalData,
    isLoading,
    alarmSettings,
    activeAlarms,
    fetchLatestData,
    fetchHistoricalData,
    saveAlarmSettings,
    clearAlarms
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
