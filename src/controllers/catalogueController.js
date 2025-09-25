const { validationResult } = require('express-validator');
const Catalogue = require('../models/Catalogue');
const Download = require('../models/Download');
const logActivity = require('../utils/logActivity');
const path = require('path');
const fs = require('fs');

// Get all catalogues
const getCatalogues = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.q || '';
        const category = req.query.category;

        let filter = { isActive: true };

        if (search) {
            filter.$or = [
                { fileName: new RegExp(search, 'i') },
                { originalName: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        if (category) filter.category = category;

        const [catalogues, total] = await Promise.all([
            Catalogue.find(filter)
                .sort({ uploadedAt: -1 })
                .skip(skip)
                .limit(limit),
            Catalogue.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                catalogues,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    limit
                }
            },
            message: 'Catalogues retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get catalogues error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Get catalogue by ID
const getCatalogueById = async (req, res) => {
    try {
        const { id } = req.params;

        const catalogue = await Catalogue.findById(id);
        if (!catalogue || !catalogue.isActive) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Catalogue not found',
                error: 'catalogue_not_found'
            });
        }

        res.json({
            success: true,
            data: { catalogue },
            message: 'Catalogue retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get catalogue by ID error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Upload catalogue (Admin only)
const uploadCatalogue = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                data: {},
                message: 'No file uploaded',
                error: 'no_file'
            });
        }

        const { description, category } = req.body;
        const file = req.file;

        const catalogue = await Catalogue.create({
            fileName: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: req.user._id,
            description,
            category
        });

        await logActivity({
            type: 'admin_upload_catalogue',
            adminId: req.user._id,
            details: { fileName: file.originalname, fileSize: file.size },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({
            success: true,
            data: { catalogue },
            message: 'Catalogue uploaded successfully',
            error: null
        });

    } catch (error) {
        console.error('Upload catalogue error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Update catalogue (Admin only)
const updateCatalogue = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, category, isActive } = req.body;

        const catalogue = await Catalogue.findById(id);
        if (!catalogue) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Catalogue not found',
                error: 'catalogue_not_found'
            });
        }

        const updates = {};
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = category;
        if (isActive !== undefined) updates.isActive = isActive;

        const updatedCatalogue = await Catalogue.findByIdAndUpdate(id, updates, { new: true });

        await logActivity({
            type: 'admin_update_catalogue',
            adminId: req.user._id,
            details: { catalogueId: id, updates },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: { catalogue: updatedCatalogue },
            message: 'Catalogue updated successfully',
            error: null
        });

    } catch (error) {
        console.error('Update catalogue error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete catalogue (Admin only)
const deleteCatalogue = async (req, res) => {
    try {
        const { id } = req.params;

        const catalogue = await Catalogue.findById(id);
        if (!catalogue) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Catalogue not found',
                error: 'catalogue_not_found'
            });
        }

        // Soft delete
        catalogue.isActive = false;
        await catalogue.save();

        await logActivity({
            type: 'admin_delete_catalogue',
            adminId: req.user._id,
            details: { fileName: catalogue.originalName },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: {},
            message: 'Catalogue deleted successfully',
            error: null
        });

    } catch (error) {
        console.error('Delete catalogue error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Product to catalogues mapping (like jpel2)
const PRODUCT_CATALOGUES = {
    'TapeExtrusion': ['TapeExtrusion.pdf'],
    'CircularLoom': [
        '4 Shuttle Circular Loom.pdf',
        '6 Shuttle Circular Loom.pdf',
        '8,10 & 12 Shuttle Circular Loom.pdf',
        'Circular loom with Inside Lamination.pdf'
    ],
    'ExtrusionCoating': [
        'Extrusion Coating Line.pdf',
        'Extrusion Coatling Line - POLYCOAT.pdf',
        'Extrusion Coating - Leno Lamination.pdf'
    ],
    'PrintingMachine': ['Flexo Printing Machine.pdf'],
    'BagConversion': ['Converting machine.pdf'],
    'WovenSack': ['Plastic Washing Cleaning & Recycling Line.pdf'],
    'PET': ['PET Washing Line.pdf'],
    'Monofilament': ['Monofilament Plant.pdf'],
    'BoxStrapping': ['PP and PET Box Strapping Line.pdf'],
    'SheetExtrusion': ['Sheet Extrusion Line.pdf'],
    'CastLine': ['Cast Film Line.pdf'],
    'Flexible': ['Extrusion Coating Line for Flexible Packaging.pdf']
};

// Mobile app product ID mapping (numeric IDs to product names)
const MOBILE_PRODUCT_MAPPING = {
    '1': 'TapeExtrusion',
    '2': 'CircularLoom',
    '3': 'CircularLoom',
    '4': 'ExtrusionCoating',
    '5': 'PrintingMachine',
    '6': 'BagConversion',
    '7': 'WovenSack',        // Recycling Lines
    '8': 'PET',
    '9': 'Monofilament',
    '10': 'BoxStrapping',
    '11': 'SheetExtrusion',
    '12': 'CastLine',
    '13': 'Flexible'
};

// Get all products with their catalogues
const getProducts = async (req, res) => {
    try {
        const products = Object.keys(PRODUCT_CATALOGUES).map(productId => ({
            id: productId,
            name: productId.replace(/([A-Z])/g, ' $1').trim(),
            catalogueCount: PRODUCT_CATALOGUES[productId].length,
            catalogues: PRODUCT_CATALOGUES[productId]
        }));

        res.json({
            success: true,
            data: { products },
            message: 'Products retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Download multiple catalogues for a product
const downloadProductCatalogues = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id; // Now guaranteed to exist due to authMiddleware

        console.log('🔥 DOWNLOAD PRODUCT CATALOGUES CALLED:', { productId, userId, method: req.method });

        // Handle both numeric (mobile app) and string (web) product IDs
        let actualProductId = productId;
        if (MOBILE_PRODUCT_MAPPING[productId]) {
            actualProductId = MOBILE_PRODUCT_MAPPING[productId];
            console.log('📱 Mobile app product ID mapped:', productId, '->', actualProductId);
        }

        // Get catalogues for this product
        const catalogueFileNames = PRODUCT_CATALOGUES[actualProductId];
        if (!catalogueFileNames) {
            console.log('❌ Product not found:', { productId, actualProductId });
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Product not found',
                error: 'product_not_found'
            });
        }

        // Find all catalogues for this product
        const catalogues = await Catalogue.find({
            originalName: { $in: catalogueFileNames },
            isActive: true
        });

        if (catalogues.length === 0) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'No catalogues found for this product',
                error: 'no_catalogues_found'
            });
        }

        // Return catalogue information instead of creating ZIP
        // This allows the client to download individual files
        const catalogueData = catalogues.map(catalogue => ({
            id: catalogue._id,
            fileName: catalogue.originalName,
            fileSize: catalogue.fileSize,
            downloadCount: catalogue.downloadCount,
            description: catalogue.description,
            downloadUrl: `/api/catalogue/download/${catalogue._id}`
        }));

        // Log activity (user is guaranteed to be authenticated)
        await logActivity({
            type: 'product_catalogues_download',
            userId,
            details: {
                productId: actualProductId,
                mobileProductId: productId,
                catalogueCount: catalogues.length,
                catalogueNames: catalogues.map(c => c.originalName)
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Send admin notification for product catalogue access
        const { sendNotificationEmail } = require('../services/emailService');
        await sendNotificationEmail({
            subject: 'Product Catalogues Accessed',
            message: `${actualProductId} catalogues (${catalogues.length} files) have been accessed by ${req.user.name} (${req.user.email})${productId !== actualProductId ? ` (Mobile ID: ${productId})` : ''}`,
            type: 'product_catalogues_download',
            data: {
                userName: req.user.name,
                userEmail: req.user.email,
                productId: actualProductId,
                mobileProductId: productId,
                catalogueCount: catalogues.length,
                catalogueNames: catalogues.map(c => c.originalName),
                ipAddress: req.ip,
                timestamp: new Date()
            }
        });

        res.json({
            success: true,
            data: {
                productId: actualProductId,
                mobileProductId: productId,
                catalogues: catalogueData,
                totalFiles: catalogues.length
            },
            message: 'Product catalogues retrieved successfully',
            error: null
        });

    } catch (error) {
        console.error('Download product catalogues error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Download single catalogue with tracking
const downloadCatalogue = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id; // Now guaranteed to exist due to authMiddleware

        console.log('🔥 DOWNLOAD CATALOGUE CALLED:', { id, userId, method: req.method, ip: req.ip });

        const catalogue = await Catalogue.findById(id);
        if (!catalogue || !catalogue.isActive) {
            console.log('❌ Catalogue not found or inactive:', id);
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Catalogue not found',
                error: 'catalogue_not_found'
            });
        }

        // Check if file exists
        if (!fs.existsSync(catalogue.filePath)) {
            console.log('❌ File not found on server:', catalogue.filePath);
            return res.status(404).json({
                success: false,
                data: {},
                message: 'File not found on server',
                error: 'file_not_found'
            });
        }

        console.log('✅ File found, proceeding with download tracking');

        // Log download
        try {
            const downloadRecord = await Download.create({
                userId,
                catalogueId: catalogue._id,
                fileName: catalogue.originalName,
                fileSize: catalogue.fileSize,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            console.log('✅ Download record created:', downloadRecord._id);
        } catch (downloadError) {
            console.error('❌ Error creating download record:', downloadError);
            // Continue with download even if tracking fails
        }

        // Update download count
        try {
            catalogue.downloadCount += 1;
            await catalogue.save();
            console.log('✅ Download count updated:', catalogue.downloadCount);
        } catch (countError) {
            console.error('❌ Error updating download count:', countError);
            // Continue with download even if count update fails
        }

        // Log activity (user is guaranteed to be authenticated)
        try {
            await logActivity({
                type: 'catalogue_download',
                userId,
                details: { fileName: catalogue.originalName, catalogueId: catalogue._id },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            console.log('✅ Activity logged for user:', userId);
        } catch (activityError) {
            console.error('❌ Error logging activity:', activityError);
        }

        // Send admin notification for catalogue download
        try {
            const { sendNotificationEmail } = require('../services/emailService');
            await sendNotificationEmail({
                subject: 'Catalogue Downloaded',
                message: `${catalogue.originalName} has been downloaded by ${req.user.name} (${req.user.email})`,
                type: 'catalogue_download',
                data: {
                    userName: req.user.name,
                    userEmail: req.user.email,
                    fileName: catalogue.originalName,
                    fileSize: catalogue.fileSize,
                    downloadCount: catalogue.downloadCount,
                    ipAddress: req.ip,
                    timestamp: new Date()
                }
            });
            console.log('✅ Admin notification sent');
        } catch (notificationError) {
            console.error('❌ Error sending notification:', notificationError);
        }

        console.log('📁 Starting file stream for:', catalogue.originalName);

        // Set appropriate headers
        res.setHeader('Content-Type', catalogue.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${catalogue.originalName}"`);
        res.setHeader('Content-Length', catalogue.fileSize);

        // Stream the file
        const fileStream = fs.createReadStream(catalogue.filePath);
        fileStream.pipe(res);

        fileStream.on('error', (streamError) => {
            console.error('❌ File stream error:', streamError);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    data: {},
                    message: 'Error streaming file',
                    error: streamError.message
                });
            }
        });

        fileStream.on('end', () => {
            console.log('✅ File stream completed successfully');
        });

    } catch (error) {
        console.error('❌ Download catalogue error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                data: {},
                message: 'Server error',
                error: error.message
            });
        }
    }
};

// Request catalogues by email
const requestCataloguesByEmail = async (req, res) => {
    try {
        const { productId, productTitle, userEmail, requestedAt } = req.body;
        const userId = req.user ? req.user._id : null;

        console.log('📧 EMAIL REQUEST CALLED:', { productId, productTitle, userEmail, userId });

        // Validate email
        if (!userEmail || !userEmail.includes('@')) {
            return res.status(400).json({
                success: false,
                data: {},
                message: 'Valid email address is required',
                error: 'invalid_email'
            });
        }

        // Handle both numeric (mobile app) and string (web) product IDs
        let actualProductId = productId;
        if (MOBILE_PRODUCT_MAPPING[productId]) {
            actualProductId = MOBILE_PRODUCT_MAPPING[productId];
            console.log('📱 Mobile app product ID mapped:', productId, '->', actualProductId);
        }

        // Get catalogues for this product
        const catalogueFileNames = PRODUCT_CATALOGUES[actualProductId];
        if (!catalogueFileNames) {
            console.log('❌ Product not found:', { productId, actualProductId });
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Product not found',
                error: 'product_not_found'
            });
        }

        // Find all catalogues for this product
        const catalogues = await Catalogue.find({
            originalName: { $in: catalogueFileNames },
            isActive: true
        });

        if (catalogues.length === 0) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'No catalogues found for this product',
                error: 'no_catalogues_found'
            });
        }

        // Send email with catalogue attachments
        const { sendCatalogueEmail } = require('../services/emailService');
        const emailResult = await sendCatalogueEmail({
            to: userEmail,
            productTitle: actualProductId,
            catalogues: catalogues,
            userName: req.user ? req.user.name : 'Guest User',
            userEmail: userEmail
        });

        if (!emailResult.success) {
            console.error('❌ Email sending failed:', emailResult.error);
            return res.status(500).json({
                success: false,
                data: {},
                message: 'Failed to send email. Please try again later.',
                error: 'email_send_failed'
            });
        }

        // Log activity if user is authenticated
        if (userId) {
            await logActivity({
                type: 'catalogue_email_request',
                userId,
                details: {
                    productId: actualProductId,
                    mobileProductId: productId,
                    catalogueCount: catalogues.length,
                    catalogueNames: catalogues.map(c => c.originalName),
                    userEmail: userEmail
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        // Send admin notification
        const { sendNotificationEmail } = require('../services/emailService');
        await sendNotificationEmail({
            subject: 'Catalogue Email Request',
            message: `${actualProductId} catalogues (${catalogues.length} files) have been requested by email${productId !== actualProductId ? ` (Mobile ID: ${productId})` : ''}`,
            type: 'catalogue_email_request',
            data: {
                userName: req.user ? req.user.name : 'Guest User',
                userEmail: userEmail,
                productId: actualProductId,
                mobileProductId: productId,
                catalogueCount: catalogues.length,
                catalogueNames: catalogues.map(c => c.originalName),
                ipAddress: req.ip,
                timestamp: new Date()
            }
        });

        res.json({
            success: true,
            data: {
                productId: actualProductId,
                mobileProductId: productId,
                catalogueCount: catalogues.length,
                userEmail: userEmail,
                messageId: emailResult.messageId
            },
            message: 'Catalogues sent to your email successfully',
            error: null
        });

    } catch (error) {
        console.error('Email request error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Legacy track download function
const trackDownload = async (req, res) => {
    try {
        console.log('🔥 LEGACY TRACK DOWNLOAD CALLED:', req.body);
        const { productId, productTitle, catalogueUrls, downloadedAt } = req.body;
        const userId = req.user?.userId; // Optional - can be anonymous
        const userAgent = req.get('User-Agent');
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Handle multiple catalogues - create a record for each catalogue downloaded
        const catalogueList = catalogueUrls || [];

        for (const catalogue of catalogueList) {
            // Check if this is a duplicate download from the same user/IP for this specific catalogue
            const existingDownload = await Download.findOne({
                $or: [
                    { userId: userId },
                    { ipAddress: ipAddress }
                ],
                fileName: catalogue.title,
                timestamp: {
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            });

            if (!existingDownload) {
                // Create new download record for this catalogue
                await Download.create({
                    userId: userId,
                    fileName: catalogue.title,
                    ipAddress,
                    userAgent,
                    timestamp: downloadedAt ? new Date(downloadedAt) : new Date()
                });
            }
        }

        res.status(201).json({
            success: true,
            data: {
                trackedCatalogues: catalogueList.length,
                productId,
                productTitle
            },
            message: 'Download tracked successfully',
            error: null
        });

    } catch (error) {
        console.error('Track download error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getCatalogues,
    getProducts,
    getCatalogueById,
    uploadCatalogue,
    updateCatalogue,
    deleteCatalogue,
    downloadCatalogue,
    downloadProductCatalogues,
    requestCataloguesByEmail,
    trackDownload
};