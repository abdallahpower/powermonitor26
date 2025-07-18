const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
// Load environment variables, overriding any existing ones so .env always wins
dotenv.config({ override: true });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server Configuration
const sqlConfig = {
  user: process.env.SQL_USERNAME || 'hassan',
  password: process.env.SQL_PASSWORD || 'Passw0rdhasan',
  database: process.env.SQL_DATABASE || 'powermeters',
  server: process.env.SQL_SERVER || 'DESKTOP-MRBC7LE',
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
};

// Connect to SQL Server
async function connectToDatabase() {
  try {
    await sql.connect(sqlConfig);
    console.log('Connected to SQL Server');
    // Start polling for latest data
    startDataPolling();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

// Function to poll for latest data every 5 seconds
function startDataPolling() {
  setInterval(async () => {
    try {
      const latestData = await getLatestReading();
      if (latestData) {
        io.emit('liveData', latestData);
      }
      
      // Check for alarms
      await checkAlarms();
    } catch (err) {
      console.error('Error polling data:', err);
    }
  }, 5000); // Poll every 5 seconds
}

// Store alarm settings
let alarmSettings = [];

// Function to check alarms based on user settings
async function checkAlarms() {
  if (alarmSettings.length === 0) return;
  
  try {
    const latestData = await getLatestReading();
    if (!latestData) return;
    
    const alarms = [];
    
    alarmSettings.forEach(setting => {
      const { readingField, threshold, condition } = setting;
      const currentValue = latestData[readingField];
      
      if (currentValue !== undefined) {
        let isAlarm = false;
        
        if (condition === 'greater' && currentValue > threshold) {
          isAlarm = true;
        } else if (condition === 'less' && currentValue < threshold) {
          isAlarm = true;
        }
        
        if (isAlarm) {
          alarms.push({
            readingField,
            currentValue,
            threshold,
            condition,
            timestamp: new Date()
          });
        }
      }
    });
    
    if (alarms.length > 0) {
      io.emit('alarms', alarms);
    }
  } catch (err) {
    console.error('Error checking alarms:', err);
  }
}

// Get the latest reading from the database
async function getLatestReading() {
  try {
    const result = await sql.query`
      SELECT TOP (1) *
      FROM [PowerMeters].[dbo].[ID7]
      ORDER BY [Timestamp] DESC
    `;
    
    return result.recordset[0];
  } catch (err) {
    console.error('Error getting latest reading:', err);
    return null;
  }
}

// API Routes

// Get latest reading
app.get('/api/latest', async (req, res) => {
  try {
    const latestData = await getLatestReading();
    res.json(latestData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get historical data
app.get('/api/historical', async (req, res) => {
  try {
    const { startDate, endDate, fields } = req.query;
    
    if (!startDate || !endDate || !fields) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Parse fields from comma-separated string
    const selectedFields = fields.split(',');
    
    // Validate and build field selection
    const validFields = [
      'ReadingID', 'Timestamp', 'Current_A', 'Current_B', 'Current_C', 'Current_N',
      'Current_Avg', 'Voltage_A_B', 'Voltage_B_C', 'Voltage_C_A', 'Voltage_A_N',
      'Voltage_B_N', 'Voltage_C_N', 'Voltage_L_L_Avg', 'Voltage_L_N_Avg',
      'Active_Power_A', 'Active_Power_B', 'Active_Power_C', 'Active_Power_Total',
      'Reactive_Power_A', 'Reactive_Power_B', 'Reactive_Power_C', 'Reactive_Power_Total',
      'Apparent_Power_A', 'Apparent_Power_B', 'Apparent_Power_C', 'Apparent_Power_Total',
      'Power_Factor_Total', 'Frequency', 'Active_Energy', 'Apparent_Energy',
      'Reactive_Energy_D_R', 'THD_Current_A', 'THD_Current_B', 'THD_Current_C',
      'THD_Current_N', 'THD_Voltage_A_B', 'THD_Voltage_B_C', 'THD_Voltage_C_A',
      'THD_Voltage_L_L', 'THD_Voltage_A_N', 'THD_Voltage_B_N', 'THD_Voltage_C_N',
      'THD_Voltage_L_N', 'Voltage_Unbalance_A_B', 'Voltage_Unbalance_B_C',
      'Voltage_Unbalance_C_A', 'Voltage_Unbalance_A_N', 'Voltage_Unbalance_B_N',
      'Voltage_Unbalance_C_N'
    ];
    
    const fieldSelection = selectedFields
      .filter(field => validFields.includes(field))
      .join(', ');
    
    if (!fieldSelection) {
      return res.status(400).json({ message: 'No valid fields selected' });
    }
    
    // Add aggregation interval parameter
    const { aggregationInterval } = req.query;
    
    let query;
    
    if (aggregationInterval === 'monthly') {
      // Server-side monthly aggregation
      query = `
        SELECT 
          FORMAT(Timestamp, 'yyyy-MM') as Timestamp,
          ${selectedFields.map(field => `AVG(${field}) as ${field}`).join(', ')}
        FROM [PowerMeters].[dbo].[ID7]
        WHERE Timestamp BETWEEN '${startDate}' AND '${endDate}'
        GROUP BY FORMAT(Timestamp, 'yyyy-MM')
        ORDER BY Timestamp ASC
      `;
    } else {
      // Regular query without aggregation
      query = `
        SELECT Timestamp, ${fieldSelection}
        FROM [PowerMeters].[dbo].[ID7]
        WHERE Timestamp BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY Timestamp ASC
      `;
    }
    
    const result = await sql.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Set alarm settings
app.post('/api/alarms', (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings must be an array' });
    }
    
    // Validate each setting
    const validSettings = settings.filter(setting => {
      return (
        setting.readingField && 
        setting.threshold !== undefined &&
        ['greater', 'less'].includes(setting.condition)
      );
    });
    
    alarmSettings = validSettings;
    res.json({ message: 'Alarm settings updated', count: validSettings.length });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectToDatabase();
});
