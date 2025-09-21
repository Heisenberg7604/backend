const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
                req.user = decoded;
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

const adminMiddleware = async (req, res, next) => {
    try {
        // Check if user is authenticated first
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        // Get user from database
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check for special admin credentials
        const isSpecialAdmin = (
            user.email === 'admin@jpgroup.com' ||
            user.email === 'darshan@jpgroup.com' ||
            user.email === 'contact@jpgroup.com' ||
            user.role === 'admin'
        );

        if (!isSpecialAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Add user info to request for admin controllers
        req.adminUser = user;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    adminMiddleware
};