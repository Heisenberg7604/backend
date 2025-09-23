const { validationResult } = require('express-validator');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const logActivity = require('../utils/logActivity');
const { Parser } = require('json2csv');

// Subscribe to newsletter
const subscribeNewsletter = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                data: {},
                message: 'Validation failed',
                error: errors.array()
            });
        }

        const { email, name, companyName, phoneNumber, city, source } = req.body;

        // Check if already subscribed
        const existingSubscriber = await NewsletterSubscriber.findOne({ email });

        if (existingSubscriber) {
            if (existingSubscriber.isActive) {
                return res.status(400).json({
                    success: false,
                    data: {},
                    message: 'Email is already subscribed to newsletter',
                    error: 'already_subscribed'
                });
            } else {
                // Reactivate subscription
                existingSubscriber.isActive = true;
                existingSubscriber.name = name || existingSubscriber.name;
                existingSubscriber.companyName = companyName || existingSubscriber.companyName;
                existingSubscriber.phoneNumber = phoneNumber || existingSubscriber.phoneNumber;
                existingSubscriber.city = city || existingSubscriber.city;
                existingSubscriber.source = source || existingSubscriber.source;
                existingSubscriber.unsubscribedAt = undefined;
                await existingSubscriber.save();

                await logActivity({
                    type: 'newsletter_subscribe',
                    details: { email, name, companyName, action: 'reactivated' },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return res.json({
                    success: true,
                    data: { subscriberId: existingSubscriber._id },
                    message: 'Successfully re-subscribed to newsletter',
                    error: null
                });
            }
        }

        // Create new subscription
        const subscriber = new NewsletterSubscriber({
            email,
            name,
            companyName,
            phoneNumber,
            city,
            source: source || 'app'
        });

        await subscriber.save();

        await logActivity({
            type: 'newsletter_subscribe',
            details: { email, name, companyName, action: 'new_subscription' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Send admin notification for newsletter subscription
        const { sendNotificationEmail } = require('../services/emailService');
        await sendNotificationEmail({
            subject: 'New Newsletter Subscription',
            message: `${name || 'Anonymous'} has subscribed to the newsletter`,
            type: 'newsletter_subscription',
            data: {
                userName: name,
                userEmail: email,
                companyName: companyName,
                city: city,
                ipAddress: req.ip,
                timestamp: new Date()
            }
        });

        res.status(201).json({
            success: true,
            data: { subscriberId: subscriber._id },
            message: 'Successfully subscribed to newsletter',
            error: null
        });

    } catch (error) {
        console.error('Subscribe newsletter error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Unsubscribe from newsletter
const unsubscribeNewsletter = async (req, res) => {
    try {
        const { token } = req.params;

        const subscriber = await NewsletterSubscriber.findOne({ unsubscribeToken: token });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Invalid unsubscribe token',
                error: 'invalid_token'
            });
        }

        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        await logActivity({
            type: 'newsletter_unsubscribe',
            details: { email: subscriber.email, action: 'unsubscribed' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: {},
            message: 'Successfully unsubscribed from newsletter',
            error: null
        });

    } catch (error) {
        console.error('Unsubscribe newsletter error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get newsletter subscribers (Admin only)
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

// Update subscriber status (Admin only)
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

        await logActivity({
            type: 'admin_change_subscriber_status',
            adminId: req.user._id,
            details: { email: subscriber.email, isActive },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

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

// Export newsletter subscribers to CSV (Admin only)
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
    subscribeNewsletter,
    unsubscribeNewsletter,
    getNewsletterSubscribers,
    updateSubscriberStatus,
    exportNewsletterSubscribers
};