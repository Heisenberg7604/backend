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

// Download catalogue with tracking
const downloadCatalogue = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user._id : null;

        const catalogue = await Catalogue.findById(id);
        if (!catalogue || !catalogue.isActive) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'Catalogue not found',
                error: 'catalogue_not_found'
            });
        }

        // Check if file exists
        if (!fs.existsSync(catalogue.filePath)) {
            return res.status(404).json({
                success: false,
                data: {},
                message: 'File not found on server',
                error: 'file_not_found'
            });
        }

        // Log download
        await Download.create({
            userId,
            catalogueId: catalogue._id,
            fileName: catalogue.originalName,
            fileSize: catalogue.fileSize,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Update download count
        catalogue.downloadCount += 1;
        await catalogue.save();

        // Log activity if user is authenticated
        if (userId) {
            await logActivity({
                type: 'catalogue_download',
                userId,
                details: { fileName: catalogue.originalName, catalogueId: catalogue._id },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', catalogue.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${catalogue.originalName}"`);
        res.setHeader('Content-Length', catalogue.fileSize);

        // Stream the file
        const fileStream = fs.createReadStream(catalogue.filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download catalogue error:', error);
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
    getCatalogueById,
    uploadCatalogue,
    updateCatalogue,
    deleteCatalogue,
    downloadCatalogue,
    trackDownload
};