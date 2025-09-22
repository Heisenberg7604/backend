const Activity = require('../models/Activity');

/**
 * Log user activity
 * @param {Object} params - Activity parameters
 * @param {string} params.type - Type of activity
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.adminId - Admin ID (optional)
 * @param {Object} params.details - Additional details (optional)
 * @param {string} params.ipAddress - IP address (optional)
 * @param {string} params.userAgent - User agent (optional)
 */
async function logActivity({ type, userId = null, adminId = null, details = {}, ipAddress = null, userAgent = null }) {
    try {
        await Activity.create({
            type,
            userId,
            adminId,
            details,
            ipAddress,
            userAgent
        });
    } catch (err) {
        console.error('Activity log failed:', err);
    }
}

module.exports = logActivity;
