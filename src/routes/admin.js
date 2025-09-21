const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { 
    getDashboardStats, 
    getUsers, 
    getUserById, 
    updateUserStatus,
    getCatalogueDownloads,
    getNewsletterSubscribers,
    updateSubscriberStatus
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);

// Catalogue management
router.get('/catalogue/downloads', getCatalogueDownloads);

// Newsletter management
router.get('/newsletter/subscribers', getNewsletterSubscribers);
router.put('/newsletter/subscribers/:id/status', updateSubscriberStatus);

module.exports = router;