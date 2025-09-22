const mongoose = require('mongoose');

const catalogueSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
    description: { type: String },
    category: { type: String }
}, {
    timestamps: true
});

// Index for efficient queries
catalogueSchema.index({ fileName: 1 });
catalogueSchema.index({ uploadedAt: -1 });
catalogueSchema.index({ isActive: 1 });

module.exports = mongoose.model('Catalogue', catalogueSchema);
