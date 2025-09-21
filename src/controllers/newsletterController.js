const { validationResult } = require('express-validator');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const Notification = require('../models/Notification');

// Subscribe to newsletter
const subscribeNewsletter = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, name, companyName, phoneNumber, city, source } = req.body;

        // Check if already subscribed
        const existingSubscriber = await NewsletterSubscriber.findOne({ email });

        if (existingSubscriber) {
            if (existingSubscriber.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already subscribed to newsletter'
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

                // Create notification for admin
                await Notification.create({
                    title: 'Newsletter Re-subscription',
                    message: `${email} has re-subscribed to newsletter`,
                    type: 'newsletter_signup',
                    priority: 'low',
                    relatedData: {
                        email,
                        name,
                        companyName
                    }
                });

                return res.json({
                    success: true,
                    message: 'Successfully re-subscribed to newsletter',
                    data: { subscriberId: existingSubscriber._id }
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

        // Create notification for admin
        await Notification.create({
            title: 'New Newsletter Subscription',
            message: `${email} has subscribed to newsletter`,
            type: 'newsletter_signup',
            priority: 'low',
            relatedData: {
                email,
                name,
                companyName,
                city
            }
        });

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: { subscriberId: subscriber._id }
        });

    } catch (error) {
        console.error('Subscribe newsletter error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
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
                message: 'Invalid unsubscribe token'
            });
        }

        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        res.json({
            success: true,
            message: 'Successfully unsubscribed from newsletter'
        });

    } catch (error) {
        console.error('Unsubscribe newsletter error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    subscribeNewsletter,
    unsubscribeNewsletter
};
