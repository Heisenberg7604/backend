import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
    getNotifications,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Specific routes before parameterized ones to avoid "Route not found"
router.get('/stats', getNotificationStats);
router.put('/mark-all-read', markAllAsRead);

// Get user notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markNotificationAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;