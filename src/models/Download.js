const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    catalogueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalogue', required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index for efficient queries
downloadSchema.index({ userId: 1, timestamp: -1 });
downloadSchema.index({ catalogueId: 1, timestamp: -1 });
downloadSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Download', downloadSchema);
