const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Trust proxy for rate limiting (required for Sevalla/Cloudflare)
app.set('trust proxy', 1);

console.log('🚀 Express app created');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health' || req.path === '/health' || req.path === '/api/ping'
});
app.use('/api/', limiter);

// CORS configuration - FLEXIBLE FOR MOBILE & WEB
const allowedOrigins = [
    // Development origins
    'http://localhost:8081',
    'http://localhost:5001',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:5000',
    'exp://192.168.1.100:8081',
    'exp://localhost:8081',

    // Production domains
    'https://jpgroup.industries',
    'https://www.jpgroup.industries',
'https://www.jpgroup.industries:5001'
];

// Add CORS_ORIGIN (split by comma if multiple)
if (process.env.CORS_ORIGIN) {
    const corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    allowedOrigins.push(...corsOrigins);
}

// Add FRONTEND_URL (split by comma if multiple)
if (process.env.FRONTEND_URL) {
    const frontendUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    allowedOrigins.push(...frontendUrls);
}

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Allow if origin is in allowed list
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // Allow localhost for development
        if (origin && origin.includes('localhost')) return callback(null, true);

        // Allow jpgroup.industries domains
        if (origin && origin.includes('jpgroup.industries')) return callback(null, true);

        // Allow Expo development origins
        if (origin && origin.startsWith('exp://')) return callback(null, true);

        // Allow React Native Metro bundler
        if (origin && origin.includes('metro')) return callback(null, true);

        console.log('❌ CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use((req, res, next) => {
        console.log(`📥 ${req.method} ${req.url}`);
        next();
    });
}

// MongoDB connection - PROFESSIONAL FIX
if (process.env.MONGODB_URI) {
    console.log('🔗 Connecting to MongoDB...');

    mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
    })
        .then(() => {
            console.log('✅ MongoDB connected successfully');
        })
        .catch((error) => {
            console.error('❌ MongoDB connection failed:', error.message);
            console.log('⚠️  Server will continue without database');
        });
} else {
    console.log('⚠️  MONGODB_URI not provided - running without database');
}

// Serve frontend static files FIRST
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    console.log('✅ Frontend static files enabled');
} else {
    console.log('⚠️  Frontend dist folder not found');
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/catalogue', require('./routes/catalogue'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/otp', require('./routes/otp'));

// Health check endpoints - SIMPLE AND RELIABLE
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
});

app.get('/api/ping', (req, res) => {
    res.status(200).json({
        status: 'pong',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
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
            newsletter: '/api/newsletter',
            otp: '/api/otp'
        }
    });
});

// Handle React Router (return index.html for all non-API routes)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API route not found',
            error: 'not_found'
        });
    }

    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            success: false,
            message: 'Frontend not available',
            error: 'frontend_not_found'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🚨 Server Error:', {
        message: err.message,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

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
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Heartbeat logging - reduced frequency
let heartbeatCount = 0;
setInterval(() => {
    heartbeatCount++;
    console.log(`💓 Heartbeat #${heartbeatCount} - Server alive:`, {
        uptime: Math.round(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        timestamp: new Date().toISOString()
    });
}, 60000); // Every 60 seconds (reduced from 10 seconds)

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`🔗 Server listening on: 0.0.0.0:${PORT}`);
    console.log(`💾 Initial memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log('✅ APPLICATION READY FOR REQUESTS');
});

// Optimize server settings
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 30000;

// Prevent server from closing on idle
server.on('connection', (socket) => {
    socket.setKeepAlive(true);
    socket.setTimeout(0);
});

// Log server events
server.on('error', (err) => {
    console.error('🚨 Server error:', err);
});

server.on('close', () => {
    console.log('🔒 Server closed');
});

// Prevent process from exiting
process.stdin.resume();

module.exports = app;