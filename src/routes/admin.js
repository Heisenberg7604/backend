import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { createUserValidation, updateUserValidation } from '../middleware/validation.js';
import {
    getDashboardStats,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    getActivities,
    getStats,
    getCatalogueDownloads,
    getNewsletterSubscribers,
    updateSubscriberStatus,
    exportNewsletterSubscribers
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Statistics
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.post('/users', createUserValidation, createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUserValidation, updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Activity tracking
router.get('/activity', getActivities);

// Catalogue management
router.get('/catalogue/downloads', getCatalogueDownloads);

// Newsletter management
router.get('/newsletter/subscribers', getNewsletterSubscribers);
router.put('/newsletter/subscribers/:id/status', updateSubscriberStatus);
router.get('/newsletter/export', exportNewsletterSubscribers);

export default router;