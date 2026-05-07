require('dotenv').config();

// Force Google DNS — fixes querySrv ECONNREFUSED on Windows
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ── CORS Configuration ─────────────────────────────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS || '';

// Parse env list + always allow localhost dev
const envOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', ...envOrigins];

// If ALLOWED_ORIGINS is not configured at all → open CORS (safe for initial deploy)
const isOpen = envOrigins.length === 0;

const corsOptions = {
  origin: (origin, callback) => {
    // No origin = Postman / curl / server calls → always allow
    if (!origin) return callback(null, true);

    // Open mode: no env configured yet
    if (isOpen) return callback(null, true);

    // Exact match in whitelist
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Auto-allow any *.vercel.app preview deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // Auto-allow any *.onrender.com (server-to-server)
    if (origin.endsWith('.onrender.com')) return callback(null, true);

    console.warn(`🚫 CORS blocked origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));

app.get('/', (req, res) => res.json({ status: 'FinCaL API running ✅', allowedOrigins }));

// Connect MongoDB & Start
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4
})
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 CORS mode: ${isOpen ? 'OPEN (set ALLOWED_ORIGINS to restrict)' : `Whitelist → ${allowedOrigins.join(', ')} + *.vercel.app`}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
