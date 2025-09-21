const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8081',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

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
        environment: process.env.NODE_ENV
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'JP App Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Admin connected:', socket.id);

    // Join admin room
    socket.join('admin');

    socket.on('disconnect', () => {
        console.log('🔌 Admin disconnected:', socket.id);
    });
});

// Make io available to other modules
app.set('io', io);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.IO server ready`);
});

module.exports = app;
