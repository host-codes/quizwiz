require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const authRoutes = require('./routes/auth');
const { verifyToken } = require('./middleware/auth');

const app = express();

// Use Google DNS as fallback
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Enhanced CORS Configuration
app.use(cors({
  origin: [
    "https://host-codes.github.io",
    "https://quizwiz.a-web.online",
    "http://localhost:3000"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Database Connection with validation
/*const connectWithRetry = () => {
  const connectionString = process.env.MONGODB_URI || process.env.MONGOOB_URI;
  
  // Validate connection string format
  if (!connectionString) {
    console.error('MongoDB connection error: No connection string provided');
    return setTimeout(connectWithRetry, 5000);
  }

  if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
    console.error('MongoDB connection error: Invalid connection string format. Must start with mongodb:// or mongodb+srv://');
    console.error('Current connection string:', connectionString);
    return setTimeout(connectWithRetry, 5000);
  }

  console.log('Attempting MongoDB connection with:', connectionString);
  
  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    w: 'majority'
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};*/











// Database Connection with enhanced error handling
const connectWithRetry = async () => {
  const connectionString = process.env.MONGODB_URI;
  
  if (!connectionString) {
    console.error('MongoDB URI not configured!');
    process.exit(1);
  }

  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Add these event listeners
mongoose.connection.on('connecting', () => console.log('Connecting to MongoDB...'));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

















// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB cluster');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Initialize connection
connectWithRetry();

// API Routes
app.use('/api/auth', authRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose connection disconnected through app termination');
    process.exit(0);
  });
});
