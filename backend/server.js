const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS - Allow production frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://quick-cv-three.vercel.app',  // ← Add ini!
  'https://quick-cv-git-main-michaelcwks-projects.vercel.app',  // ← Dan ini!
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
// Routes
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    env: process.env.NODE_ENV 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'QuickCV Backend API',
    endpoints: ['/health', '/api/payment/init']
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Server error' 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://10.10.2.136:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});