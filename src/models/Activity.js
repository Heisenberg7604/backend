const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'login',
            'logout',
            'user_register',
            'catalogue_download',
            'newsletter_subscribe',
            'newsletter_unsubscribe',
            'admin_create_user',
            'admin_update_user',
            'admin_delete_user',
            'admin_change_user_status',
            'admin_login',
            'password_reset_request',
            'password_reset_complete'
        ]
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for admin actions
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index for efficient queries
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ adminId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
