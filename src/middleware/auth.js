const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                data: {},
                message: 'Unauthorized',
                error: 'No token provided'
            });
        }

        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

        // Get user from database to check if still active
        const user = await User.findById(decoded.id);
        if (!user || user.isDeleted || !user.isActive) {
            return res.status(401).json({
                success: false,
                data: {},
                message: 'Unauthorized',
                error: 'User inactive or deleted'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            data: {},
            message: 'Invalid token',
            error: error.message
        });
    }
};

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (header && header.startsWith('Bearer ')) {
            const token = header.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

                // Get user from database to check if still active
                const user = await User.findById(decoded.id);
                if (user && !user.isDeleted && user.isActive) {
                    req.user = user;
                } else {
                    req.user = null;
                }
            } catch (error) {
                // Invalid token, but we continue without authentication
                req.user = null;
            }
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // Continue without authentication
        req.user = null;
        next();
    }
};

const requireRole = (role) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            data: {},
            message: 'Unauthorized',
            error: 'No user'
        });
    }

    if (req.user.role !== role) {
        return res.status(403).json({
            success: false,
            data: {},
            message: 'Forbidden',
            error: 'Insufficient role'
        });
    }

    next();
};

const adminMiddleware = async (req, res, next) => {
    try {
        // Check if user is authenticated first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                data: {},
                message: 'Access denied. Authentication required.',
                error: 'No user'
            });
        }

        // Check for admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                data: {},
                message: 'Access denied. Admin privileges required.',
                error: 'Insufficient role'
            });
        }

        // Add user info to request for admin controllers
        req.adminUser = req.user;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    adminMiddleware,
    requireRole
};