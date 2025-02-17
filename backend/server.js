require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const requestRoutes = require('./routes/requestRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');
const freeFoodRoutes = require('./routes/freeFoodRoutes');
const app = require('./app');
const morgan = require('morgan');

// Connect to database
mongoose.connection.once('open', () => {
  console.log('MongoDB Connected:', mongoose.connection.host);
});

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173' || 'https://wall-of-humanity.vercel.app', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(morgan('dev')); // Logs HTTP requests
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Create upload directories if they don't exist
const uploadDirs = ['uploads', 'uploads/donations', 'uploads/ngo-logos', 'uploads/ngo-certificates'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const freeFoodUploadsDir = path.join(__dirname, 'uploads', 'free-food');
if (!fs.existsSync(freeFoodUploadsDir)){
    fs.mkdirSync(freeFoodUploadsDir, { recursive: true });
}

// Then mount routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/free-food', freeFoodRoutes);

// Add this after your other middleware
app.use('/uploads', express.static('uploads'));

// Error handling middleware should be last
app.use(errorHandler);

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Only start server after successful DB connection
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}`);
        server.listen(PORT + 1);
      } else {
        console.error('Server error:', error);
      }
    });

  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

app.use('/uploads', (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Static file request: ${req.path}`);
    next();
});