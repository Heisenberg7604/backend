const { validationResult } = require('express-validator');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Download = require('../models/Download');
const Catalogue = require('../models/Catalogue');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const logActivity = require('../utils/logActivity');
const { Parser } = require('json2csv');

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalDownloads,
            totalSubscribers,
            activeSubscribers,
            recentUsers,
            recentActivities,
            recentDownloads
        ] = await Promise.all([
            User.countDocuments({ isDeleted: false }),
            User.countDocuments({ isActive: true, isDeleted: false }),
            Download.countDocuments(),
            NewsletterSubscriber.countDocuments(),
            NewsletterSubscriber.countDocuments({ isActive: true }),
            User.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email companyName createdAt'),
            Activity.find()
                .populate('userId', 'name email')
                .sort({ timestamp: -1 })
                .limit(10),
            Download.find()
                .populate('userId', 'name email')
                .populate('catalogueId', 'fileName')
                .sort({ timestamp: -1 })
                .limit(10)
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    totalDownloads,
                    totalSubscribers,
                    activeSubscribers
                },
                recent: {
                    users: recentUsers,
                    activities: recentActivities,
                    downloads: recentDownloads
                }
            },
            message: 'Dashboard stats retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get comprehensive statistics
const getStats = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // User growth over time (monthly)
        const userGrowth = await User.aggregate([
            { $match: { isDeleted: false, createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Active vs Inactive users
        const userStatus = await User.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$isActive", count: { $sum: 1 } } }
        ]);

        // Downloads over time
        const downloadsOverTime = await Download.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" }
                    },
                    downloads: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Login frequency (for heatmap)
        const loginFrequency = await Activity.aggregate([
            { $match: { type: 'login', timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        hour: { $hour: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1, "_id.hour": 1 } }
        ]);

        // Top downloaded catalogues
        const topDownloads = await Download.aggregate([
            { $group: { _id: "$catalogueId", count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'catalogues',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'catalogue'
                }
            },
            { $unwind: '$catalogue' },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    fileName: '$catalogue.fileName',
                    downloadCount: '$count'
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                userGrowth,
                userStatus,
                downloadsOverTime,
                loginFrequency,
                topDownloads
            },
            message: 'Statistics retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get all users with pagination and search
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.q || '';
        const role = req.query.role;
        const isActive = req.query.isActive;

        let filter = { isDeleted: false };

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { companyName: new RegExp(search, 'i') }
            ];
        }

        if (role) filter.role = role;
        if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    limit
                }
            },
            message: 'Users retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Create new user
const createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                data: {},
                message: 'Validation errors',
                error: errors.array()
            });
        }

        const { name, email, password, companyName, phoneNumber, city, role = 'user' } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                data: {},
                message: 'User with this email already exists',
                error: 'duplicate_email'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            companyName,
            phoneNumber,
            city,
            role
        });

        await logActivity({
            type: 'admin_create_user',
            adminId: req.user._id,
            details: { email, name, role },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({
            success: true,
            data: { user: { id: user._id, name: user.name, email: user.email, role: user.role } },
            message: 'User created successfully',
            error: null
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');
        if (!user || user.isDeleted) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'User not found',
                error: 'user_not_found'
            });
        }

        // Get user's recent activities
        const activities = await Activity.find({ userId: id })
            .sort({ timestamp: -1 })
            .limit(10);

        // Get user's downloads
        const downloads = await Download.find({ userId: id })
            .populate('catalogueId', 'fileName')
            .sort({ timestamp: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                user,
                activities,
                downloads
            },
            message: 'User details retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const user = await User.findById(id);
        if (!user || user.isDeleted) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'User not found',
                error: 'user_not_found'
            });
        }

        // Don't allow updating password through this endpoint
        delete updates.password;

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

        await logActivity({
            type: 'admin_update_user',
            adminId: req.user._id,
            userId: user._id,
            details: updates,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: { user: updatedUser },
            message: 'User updated successfully',
            error: null
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findById(id);
        if (!user || user.isDeleted) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'User not found',
                error: 'user_not_found'
            });
        }

        user.isActive = isActive;
        await user.save();

        await logActivity({
            type: 'admin_change_user_status',
            adminId: req.user._id,
            userId: user._id,
            details: { isActive },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: { user: { id: user._id, name: user.name, email: user.email, isActive: user.isActive } },
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            error: null
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Soft delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user || user.isDeleted) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'User not found',
                error: 'user_not_found'
            });
        }

        user.isDeleted = true;
        user.isActive = false;
        await user.save();

        await logActivity({
            type: 'admin_delete_user',
            adminId: req.user._id,
            userId: user._id,
            details: { email: user.email, name: user.name },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: {},
            message: 'User deleted successfully',
            error: null
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get recent activities
const getActivities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const type = req.query.type;

        let filter = {};
        if (type) filter.type = type;

        const [activities, total] = await Promise.all([
            Activity.find(filter)
                .populate('userId', 'name email')
                .populate('adminId', 'name email')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            Activity.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    limit
                }
            },
            message: 'Activities retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get catalogue downloads
const getCatalogueDownloads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [downloads, total] = await Promise.all([
            Download.find()
                .populate('userId', 'name email companyName')
                .populate('catalogueId', 'fileName originalName')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            Download.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                downloads,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    limit
                }
            },
            message: 'Catalogue downloads retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get catalogue downloads error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get newsletter subscribers
const getNewsletterSubscribers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.q || '';
        const isActive = req.query.isActive;

        let filter = {};

        if (search) {
            filter.$or = [
                { email: new RegExp(search, 'i') },
                { name: new RegExp(search, 'i') },
                { companyName: new RegExp(search, 'i') }
            ];
        }

        if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

        const [subscribers, total] = await Promise.all([
            NewsletterSubscriber.find(filter)
                .sort({ subscribedAt: -1 })
                .skip(skip)
                .limit(limit),
            NewsletterSubscriber.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                subscribers,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    limit
                }
            },
            message: 'Newsletter subscribers retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get newsletter subscribers error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
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
                data: {},
                message: 'Subscriber not found',
                error: 'subscriber_not_found'
            });
        }

        subscriber.isActive = isActive;
        if (!isActive) {
            subscriber.unsubscribedAt = new Date();
        }
        await subscriber.save();

        res.json({
            success: true,
            data: { subscriber: { id: subscriber._id, email: subscriber.email, isActive: subscriber.isActive } },
            message: `Subscriber ${isActive ? 'activated' : 'deactivated'} successfully`,
            error: null
        });

    } catch (error) {
        console.error('Update subscriber status error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Export newsletter subscribers to CSV
const exportNewsletterSubscribers = async (req, res) => {
    try {
        const subscribers = await NewsletterSubscriber.find({});

        const fields = [
            'email',
            'name',
            'companyName',
            'phoneNumber',
            'city',
            'source',
            'isActive',
            'subscribedAt',
            'unsubscribedAt',
            'emailCount'
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(subscribers);

        res.header('Content-Type', 'text/csv');
        res.attachment('newsletter_subscribers.csv');
        res.send(csv);

    } catch (error) {
        console.error('Export newsletter subscribers error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getStats,
    getUsers,
    createUser,
    getUserById,
    updateUser,
    updateUserStatus,
    deleteUser,
    getActivities,
    getCatalogueDownloads,
    getNewsletterSubscribers,
    updateSubscriberStatus,
    exportNewsletterSubscribers
};