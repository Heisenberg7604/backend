const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    name: {
        type: String,
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    companyName: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot be more than 100 characters']
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: ['website', 'app', 'admin', 'other'],
        default: 'app'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    unsubscribedAt: Date,
    unsubscribeToken: String,
    lastEmailSent: Date,
    emailCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for better performance
newsletterSubscriberSchema.index({ email: 1 });
newsletterSubscriberSchema.index({ isActive: 1 });
newsletterSubscriberSchema.index({ subscribedAt: -1 });

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
