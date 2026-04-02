import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import corsMiddleware from './config/cors.js';
import './config/env.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import catalogueRoutes from './routes/catalogue.js';
import newsletterRoutes from './routes/newsletter.js';
import notificationsRoutes from './routes/notifications.js';
import otpRoutes from './routes/otp.js';

dotenv.config();

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

app.use(corsMiddleware);

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/otp', otpRoutes);

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

// API-only 404 handler (no HTML responses)
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        data: {},
        message: 'Route not found',
        error: 'not_found'
    });
});

// Non-API 404 handler (backend is API-only)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
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

export default app;
