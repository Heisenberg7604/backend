const mongoose = require('mongoose');

const catalogueDownloadSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    productId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    catalogueUrl: {
        type: String,
        required: true
    },
    catalogueTitle: {
        type: String,
        required: true
    },
    catalogueType: {
        type: String,
        required: true
    },
    downloadCount: {
        type: Number,
        default: 1
    },
    userAgent: String,
    ipAddress: String,
    downloadDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better performance
catalogueDownloadSchema.index({ user: 1 });
catalogueDownloadSchema.index({ productId: 1 });
catalogueDownloadSchema.index({ downloadDate: -1 });

module.exports = mongoose.model('CatalogueDownload', catalogueDownloadSchema);
