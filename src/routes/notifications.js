const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getNotifications, markNotificationAsRead } = require('../controllers/notificationController');

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markNotificationAsRead);

module.exports = router;