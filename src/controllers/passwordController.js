const { validationResult } = require('express-validator');
const User = require('../models/User');
const logActivity = require('../utils/logActivity');

// Reset password with OTP verification
const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                data: {},
                message: 'Validation failed',
                error: errors.array()
            });
        }

        const { token, password } = req.body;

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                data: {},
                message: 'Invalid or expired reset token',
                error: 'invalid_token'
            });
        }

        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetOTP = undefined;
        user.passwordResetOTPExpires = undefined;
        await user.save();

        // Log password reset completion activity
        await logActivity({
            type: 'password_reset_complete',
            userId: user._id,
            details: { email: user.email, method: 'otp' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: {},
            message: 'Password has been reset successfully',
            error: null
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    resetPassword
};
