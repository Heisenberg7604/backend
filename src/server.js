const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Trust proxy for rate limiting (required for Sevalla/Cloudflare)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/api/health' || req.path === '/'
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = [
    'http://localhost:8081',  // Expo default
    'http://localhost:19006',  // Expo web
    'http://localhost:3000',   // Common React port
    'exp://192.168.1.100:8081', // Physical device (replace with your IP)
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // For development, allow any localhost origin
        if (origin && origin.includes('localhost')) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// MongoDB connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
        })
        .catch((error) => {
            console.error('❌ MongoDB connection error:', error);
            console.log('⚠️  Server will continue without database connection');
        });
} else {
    console.log('⚠️  No MongoDB URI provided - server running without database');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/catalogue', require('./routes/catalogue'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/notifications', require('./routes/notifications'));

// Basic health check (no database dependency)
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'JP App Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        endpoints: {
            health: '/api/health',
            ping: '/api/ping',
            auth: '/api/auth',
            admin: '/api/admin',
            catalogue: '/api/catalogue',
            newsletter: '/api/newsletter'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'OK',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            memory: process.memoryUsage(),
            pid: process.pid
        },
        message: 'JP App Backend is running',
        error: null
    });
});

// Keep-alive endpoint for Sevalla
app.get('/api/ping', (req, res) => {
    res.status(200).json({ 
        status: 'pong', 
        timestamp: new Date().toISOString() 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        data: {},
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        data: {},
        message: 'Route not found',
        error: 'not_found'
    });
});

const PORT = process.env.PORT || 5001;

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    console.log('📊 Process info:', {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
    });
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    console.error('Stack:', err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Log every 5 seconds to keep process alive and show it's working
setInterval(() => {
    console.log('💓 Heartbeat - Server is alive:', {
        uptime: Math.round(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        timestamp: new Date().toISOString()
    });
}, 5000);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`🔗 Server listening on: 0.0.0.0:${PORT}`);
});

// Keep the process alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

module.exports = app;
