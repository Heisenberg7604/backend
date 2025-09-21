const { validationResult } = require('express-validator');
const CatalogueDownload = require('../models/CatalogueDownload');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

// Track catalogue download
const trackDownload = async (req, res) => {
    try {
        const { productId, productTitle, catalogueUrls, downloadedAt } = req.body;
        const userId = req.user?.userId; // Optional - can be anonymous
        const userAgent = req.get('User-Agent');
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Handle multiple catalogues - create a record for each catalogue downloaded
        const catalogueList = catalogueUrls || [];

        for (const catalogue of catalogueList) {
            // Check if this is a duplicate download from the same user/IP for this specific catalogue
            const existingDownload = await CatalogueDownload.findOne({
                $or: [
                    { user: userId },
                    { ipAddress: ipAddress }
                ],
                productId,
                catalogueUrl: catalogue.url,
                downloadDate: {
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            });

            if (existingDownload) {
                // Increment download count
                existingDownload.downloadCount += 1;
                await existingDownload.save();
            } else {
                // Create new download record for this catalogue
                const download = new CatalogueDownload({
                    user: userId,
                    productId,
                    productName: productTitle,
                    catalogueUrl: catalogue.url,
                    catalogueTitle: catalogue.title,
                    catalogueType: catalogue.type,
                    userAgent,
                    ipAddress,
                    downloadDate: downloadedAt ? new Date(downloadedAt) : new Date()
                });

                await download.save();
            }
        }

        // Create notification for admin
        const catalogueCount = catalogueList.length;
        const catalogueNames = catalogueList.map(cat => cat.title).join(', ');

        await Notification.create({
            title: 'New Catalogue Download',
            message: `${productTitle} - ${catalogueCount} catalogue(s) downloaded: ${catalogueNames}${userId ? ' by registered user' : ' by anonymous user'}`,
            type: 'catalogue_download',
            priority: 'low',
            relatedUser: userId,
            relatedData: {
                productId,
                productTitle,
                catalogueUrls: catalogueList,
                catalogueCount,
                ipAddress
            }
        });

        res.status(201).json({
            success: true,
            message: 'Download tracked successfully',
            data: {
                trackedCatalogues: catalogueList.length,
                productId,
                productTitle
            }
        });

    } catch (error) {
        console.error('Track download error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

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
    trackDownload,
    subscribeNewsletter,
    unsubscribeNewsletter
};
