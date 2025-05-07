require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const { verifyToken } = require('./middleware/auth');

const app = express();

// Enhanced CORS Configuration
/*app.use(cors({
  origin: [
    "https://your-github-username.github.io", // Your GitHub Pages URL
    "https://yourcustomdomain.com", // If you have a custom domain
    "http://localhost:3000" // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));*/


app.use(cors({
  origin: [
    "https://host-codes.github.io", // Your GitHub Pages URL
    "https://quizwiz.a-web.online", // Your custom domain
    "http://localhost:3000" // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));



// Middleware
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
});

// API Routes
app.use('/api/auth', authRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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
