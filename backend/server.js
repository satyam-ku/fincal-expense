require('dotenv').config();

// Force Google DNS — fixes querySrv ECONNREFUSED on Windows
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ── CORS Configuration ────────────────────────────────────────────────────────
// Reads from ALLOWED_ORIGINS env var (comma-separated list)
// Always allows localhost:3000 for local development
const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = [
  'http://localhost:3000',
  ...rawOrigins.split(',').map(o => o.trim()).filter(Boolean)
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,                  // Allow Authorization header / cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200           // Some browsers send 204 for OPTIONS, use 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // Handle all preflight OPTIONS requests
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));

app.get('/', (req, res) => res.json({ status: 'FinCaL API running ✅' }));

// Connect MongoDB & Start
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4
})
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
