const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database (Initializes MongoDB or triggers local JSON fallback)
const db = require('./database/db');

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support base64 uploads for documents/damages
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Expose Static directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Route Mounts
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/damage', require('./routes/damageRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Serve Interactive Mobile Simulator Web App for Root URL
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error caught in middleware:", err);
  res.status(500).json({ success: false, message: 'Server runtime execution error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(` RideEase Backend Service is running on http://localhost:${PORT}`);
  console.log(` Interactive Mobile Simulator: http://localhost:${PORT}`);
  console.log(` Current Database Mode: ${db.useLocal ? 'OFFLINE LOCAL JSON' : 'ONLINE MONGO_DB'}`);
  console.log(`===========================================================`);
});
