const { validationResult } = require('express-validator');
const User = require('../models/User');
const CatalogueDownload = require('../models/CatalogueDownload');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const Notification = require('../models/Notification');

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalDownloads,
            unreadNotifications,
            totalSubscribers,
            activeSubscribers,
            recentUsers,
            recentDownloads,
            recentSubscribers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            CatalogueDownload.countDocuments(),
            Notification.countDocuments({ isRead: false }),
            NewsletterSubscriber.countDocuments(),
            NewsletterSubscriber.countDocuments({ isActive: true }),
            User.find().sort({ createdAt: -1 }).limit(5).select('name email companyName createdAt'),
            CatalogueDownload.find().populate('user', 'name email companyName').sort({ downloadDate: -1 }).limit(5),
            NewsletterSubscriber.find().sort({ subscribedAt: -1 }).limit(5)
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    totalDownloads,
                    unreadNotifications,
                    totalSubscribers,
                    activeSubscribers
                },
                recent: {
                    users: recentUsers,
                    downloads: recentDownloads,
                    subscribers: recentSubscribers
                }
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get all users
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { companyName: { $regex: search, $options: 'i' } },
                    { city: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's download history
        const downloads = await CatalogueDownload.find({ user: id })
            .sort({ downloadDate: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                user,
                downloads
            }
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user status
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isActive = isActive;
        await user.save();

        // Create notification
        await Notification.create({
            title: `User ${isActive ? 'Activated' : 'Deactivated'}`,
            message: `${user.name} (${user.email}) has been ${isActive ? 'activated' : 'deactivated'}`,
            type: 'info',
            priority: 'medium',
            relatedUser: user._id
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isActive: user.isActive
                }
            }
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get catalogue downloads
const getCatalogueDownloads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const productId = req.query.productId;

        let query = {};
        if (productId) {
            query.productId = productId;
        }

        const [downloads, total] = await Promise.all([
            CatalogueDownload.find(query)
                .populate('user', 'name email companyName')
                .sort({ downloadDate: -1 })
                .skip(skip)
                .limit(limit),
            CatalogueDownload.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                downloads,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get catalogue downloads error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get newsletter subscribers
const getNewsletterSubscribers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = {};
        if (search) {
            query = {
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { companyName: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const [subscribers, total] = await Promise.all([
            NewsletterSubscriber.find(query)
                .sort({ subscribedAt: -1 })
                .skip(skip)
                .limit(limit),
            NewsletterSubscriber.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                subscribers,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get newsletter subscribers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update subscriber status
const updateSubscriberStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const subscriber = await NewsletterSubscriber.findById(id);
        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        subscriber.isActive = isActive;
        if (!isActive) {
            subscriber.unsubscribedAt = new Date();
        }
        await subscriber.save();

        res.json({
            success: true,
            message: `Subscriber ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                subscriber: {
                    id: subscriber._id,
                    email: subscriber.email,
                    name: subscriber.name,
                    isActive: subscriber.isActive
                }
            }
        });

    } catch (error) {
        console.error('Update subscriber status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    getUserById,
    updateUserStatus,
    getCatalogueDownloads,
    getNewsletterSubscribers,
    updateSubscriberStatus
};
