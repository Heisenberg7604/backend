const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');

// Get notifications for admin
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const type = req.query.type;
        const priority = req.query.priority;
        const isRead = req.query.isRead;

        let query = {};

        if (type) {
            query.type = type;
        }

        if (priority) {
            query.priority = priority;
        }

        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .populate('relatedUser', 'name email companyName')
                .populate('readBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(query),
            Notification.countDocuments({ isRead: false })
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                },
                unreadCount
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        notification.readBy = userId;
        await notification.save();

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: { notification }
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await Notification.updateMany(
            { isRead: false },
            {
                isRead: true,
                readAt: new Date(),
                readBy: userId
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create notification (admin only)
const createNotification = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { title, message, type, priority, relatedUser, relatedData, expiresAt } = req.body;

        const notification = new Notification({
            title,
            message,
            type: type || 'info',
            priority: priority || 'medium',
            relatedUser,
            relatedData,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined
        });

        await notification.save();

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: { notification }
        });

    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get notification stats
const getNotificationStats = async (req, res) => {
    try {
        const [
            total,
            unread,
            byType,
            byPriority
        ] = await Promise.all([
            Notification.countDocuments(),
            Notification.countDocuments({ isRead: false }),
            Notification.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            Notification.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                total,
                unread,
                byType: byType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byPriority: byPriority.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead: markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getNotificationStats
};
