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

// MongoDB connection with optimized settings
if (process.env.MONGODB_URI) {
    const mongooseOptions = {
        maxPoolSize: 5, // Limit connection pool size
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
    };

    mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
        .then(() => {
            console.log('✅ Connected to MongoDB with optimized settings');
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

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    console.log('✅ Frontend static files enabled');
} else {
    console.log('⚠️  Frontend dist folder not found - serving API only');
}

// Handle React Router (return index.html for all non-API routes)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API route not found',
            error: 'not_found'
        });
    }

    // Check if frontend files exist
    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            success: false,
            message: 'Frontend not available - please deploy frontend separately',
            error: 'frontend_not_found',
            suggestion: 'Deploy frontend as separate Sevalla app or ensure frontend/dist exists'
        });
    }
});

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
    const memUsage = process.memoryUsage();
    const healthData = {
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
        },
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        heartbeatCount: heartbeatCount
    };

    console.log('🏥 Health check requested:', healthData);
    res.status(200).json({
        success: true,
        data: healthData,
        message: 'JP App Backend is running',
        error: null
    });
});

// Enhanced ping endpoint for Sevalla
app.get('/api/ping', (req, res) => {
    console.log('🏓 Ping requested at:', new Date().toISOString());
    res.status(200).json({
        status: 'pong',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
});

// Simple API test endpoint
app.get('/api/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
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
let heartbeatCount = 0;
setInterval(() => {
    heartbeatCount++;
    console.log(`💓 Heartbeat #${heartbeatCount} - Server is alive:`, {
        uptime: Math.round(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        timestamp: new Date().toISOString(),
        pid: process.pid
    });

    // Force garbage collection every 10 heartbeats to keep memory low
    if (heartbeatCount % 10 === 0 && global.gc) {
        global.gc();
        console.log('🧹 Garbage collection performed');
    }
}, 5000);

// Additional keep-alive mechanism - ping every 30 seconds
setInterval(() => {
    console.log('🏓 Keep-alive ping:', new Date().toISOString());
}, 30000);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`🔗 Server listening on: 0.0.0.0:${PORT}`);
    console.log(`💾 Initial memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

// Optimize server settings for Sevalla
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
