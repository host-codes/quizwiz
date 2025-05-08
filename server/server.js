

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const { verifyToken } = require('./middleware/auth');

// Use Google DNS as fallback
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Add this debug logging right here ▼
console.log('Environment Variables:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'exists' : 'missing',
  NODE_ENV: process.env.NODE_ENV || 'development (default)',
  PORT: process.env.PORT || '3000 (default)'
});


const nodemailer = require('nodemailer');
const app = express();

// 3. Configure Nodemailer (PASTE THIS BEFORE THE ROUTE)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your email
    pass: 'your-app-password'     // Use a 16-digit app password
  }
});



// 4. ✅ PASTE YOUR CODE HERE (Signup route)
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  // 1. Save user to DB (MongoDB)
  // 2. Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  
  // 3. Send OTP via email
  await transporter.sendMail({
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Your OTP for Verification',
    text: `Your OTP is: ${otp}`
  });

  // 4. Respond to frontend
  res.json({ success: true, message: 'OTP sent to email!' });
});

// 5. Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});














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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Middleware
app.use(express.json());

// Database Connection with enhanced error handling
const connectWithRetry = async () => {
  //const connectionString = process.env.MONGODB_URI;
    const connectionString = process.env.MONGODB_URI.replace(/\s/g, ''); // Remove any whites
  
  if (!connectionString) {
    console.error('MongoDB URI not configured!');
    process.exit(1);
  }

  if (!connectionString.startsWith('mongodb://') && 
      !connectionString.startsWith('mongodb+srv://')) {
    console.error('Invalid MongoDB connection string format');
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

// MongoDB Connection Event Listeners
mongoose.connection.on('connecting', () => console.log('Connecting to MongoDB...'));
mongoose.connection.on('connected', () => console.log('Mongoose connected to DB cluster'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

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
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Handle SPA routing with existence check
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Frontend not built',
      suggestion: 'Run npm run build in client directory'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ 
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'production' ? undefined : err.message
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
