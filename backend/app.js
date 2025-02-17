const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:5173' || 'https://wall-of-humanity.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create upload directories
const uploadDirs = ['uploads/donations', 'uploads/free-food'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/free-food', require('./routes/freeFoodRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));

// Add this after all your routes
app.use(errorHandler);

module.exports = app;