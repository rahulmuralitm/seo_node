require('dotenv').config();

const express = require('express');
const cors = require('cors');
const scanRoutes = require('./routes/scan');
const chatbotRoutes = require('./routes/chatbot');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for hosted environments
app.set('trust proxy', 1);

// CORS configuration for hosted environments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);

    // For production, you might want to restrict to specific domains
    // For now, allow all for testing
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API test endpoint
app.get('/api/test', async (req, res) => {
  try {
    // Test basic connectivity
    const axios = require('axios');
    const testResponse = await axios.get('https://httpbin.org/get', {
      timeout: 5000,
      headers: {
        'User-Agent': 'SEOAnalyzer-Test/1.0'
      }
    });

    res.json({
      status: 'OK',
      externalConnectivity: true,
      responseTime: testResponse.data.url ? 'Fast' : 'Slow'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      externalConnectivity: false,
      error: error.code || error.message
    });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

app.use('/api/scan', scanRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
