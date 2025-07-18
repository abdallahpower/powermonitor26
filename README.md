# Power Monitor

A modern, responsive power monitoring application that provides real-time and historical data visualization from SQL Server power meter readings.

## Features

- **Live Monitoring**: View real-time power meter readings through interactive gauges
- **Historical Data Analysis**: Visualize historical data with customizable line charts
- **Alarm System**: Set up notifications for readings that exceed specified thresholds
- **Responsive Design**: Fully responsive UI that works on desktop and mobile devices

## Project Structure

- `/backend`: Node.js Express server with SQL Server connectivity
- `/frontend`: React application with Material UI components

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQL Server instance with power meter data

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd powermonitor/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file (already done) with your SQL Server credentials:
   ```
   SQL_SERVER=DESKTOP-C0A5N3K
   SQL_DATABASE=powermeters
   SQL_USERNAME=hassan
   SQL_PASSWORD=Passw0rdhasan
   PORT=5000
   ```

4. Start the backend server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd powermonitor/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

## Usage

After starting both servers:

1. Open your browser and navigate to `http://localhost:3000`
2. The dashboard will display live readings from your power meter
3. Navigate to "Historical Data" to view and analyze historical trends
4. Go to "Alarm Settings" to configure notifications for values outside acceptable ranges

## Technologies Used

### Backend
- Node.js with Express
- SQL Server (mssql package)
- Socket.io for real-time updates

### Frontend
- React
- Material UI for responsive components
- Chart.js for data visualization
- React Gauge Chart for real-time gauges
- Socket.io-client for real-time updates

## Data Structure

The application works with the ID7 table in the PowerMeters database, which contains various electrical measurements including:

- Current readings (A, B, C, N, Avg)
- Voltage readings (A-B, B-C, C-A, etc.)
- Power readings (Active, Reactive, Apparent)
- Power factor, frequency
- Total harmonic distortion (THD) values
- Energy measurements
