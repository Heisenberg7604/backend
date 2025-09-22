const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');
const logActivity = require('../utils/logActivity');

// Forgot password
const forgotPassword = async (req, res) => {
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

        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await user.save();

        // Send email using SMTP
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            const emailResult = await sendPasswordResetEmail({
                to: email,
                resetUrl: resetUrl,
                userName: user.name
            });

            if (emailResult.success) {
                // Log password reset request activity
                await logActivity({
                    type: 'password_reset_request',
                    userId: user._id,
                    details: { email: user.email },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.json({
                    success: true,
                    data: {},
                    message: 'If an account with that email exists, we have sent a password reset link.',
                    error: null
                });
            } else {
                throw new Error(emailResult.error);
            }

        } catch (emailError) {
            console.error('Email sending error:', emailError);

            // Clear the reset token if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            res.status(500).json({
                success: false,
                data: {},
                message: 'Error sending email. Please try again later.',
                error: emailError.message
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

// Reset password
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
        await user.save();

        // Log password reset completion activity
        await logActivity({
            type: 'password_reset_complete',
            userId: user._id,
            details: { email: user.email },
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

// Verify reset token
const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

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

        res.json({
            success: true,
            message: 'Reset token is valid'
        });

    } catch (error) {
        console.error('Verify reset token error:', error);
        res.status(500).json({
            success: false,
            data: {},
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    forgotPassword,
    resetPassword,
    verifyResetToken
};
