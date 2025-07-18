import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Dashboard from './pages/Dashboard';
import HistoricalData from './pages/HistoricalData';
import Login from './pages/Login';
import AlarmSettings from './pages/AlarmSettings';
import Metrics from './pages/Metrics';

import ReactFlowSLD from './pages/ReactFlowSLD';

// Components
import Layout from './components/Layout';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#00C851', // bright green from logo
    },
    secondary: {
      main: '#1B1B1B', // dark gray / black from logo
    },
    background: {
      default: '#f8f9fa', // light gray for background
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={5000} />
      <Layout>
        <Routes>
            <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/historical" element={<RequireAuth><HistoricalData /></RequireAuth>} />
          <Route path="/metrics" element={<RequireAuth><Metrics /></RequireAuth>} />
          <Route path="/alarms" element={<RequireAuth><AlarmSettings /></RequireAuth>} />
          
          <Route path="/sld" element={<RequireAuth><ReactFlowSLD /></RequireAuth>} />
        </Routes>
      </Layout>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
