const crypto = require('crypto');
const { Resend } = require('resend');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const resend = new Resend(process.env.RESEND_API_KEY);

// Forgot password
const forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
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

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await resend.emails.send({
                from: process.env.FROM_EMAIL || 'noreply@jpgroup.industries',
                to: [email],
                subject: 'Password Reset Request - JP Group',
                html: `
          <div style="font-family: Arial, sans-serif; border: 2px dashed #000; padding: 20px; max-width: 600px; margin: auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://jpel.in/static/media/footer-logo.6cd7aaadced76bd27f40.jpg" alt="JP Group Logo" style="max-width: 400px;">
            </div>
            
            <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="margin-bottom: 15px;">Dear ${user.name},</p>
            
            <p style="margin-bottom: 15px;">You have requested to reset your password for your JP Group account.</p>
            
            <p style="margin-bottom: 15px;">Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="margin-bottom: 15px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; margin-bottom: 15px;">${resetUrl}</p>
            
            <p style="margin-bottom: 15px;"><strong>This link will expire in 10 minutes.</strong></p>
            
            <p style="margin-bottom: 15px;">If you didn't request this password reset, please ignore this email.</p>
            
            <p style="margin-bottom: 5px;">Regards,</p>
            <p style="margin-bottom: 5px; font-weight: bold;">J P Extrusiontech Private Limited</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an auto generated email. PLEASE DO NOT REPLY directly to this email.</p>
          </div>
        `
            });

            res.json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.'
            });

        } catch (emailError) {
            console.error('Email sending error:', emailError);

            // Clear the reset token if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            res.status(500).json({
                success: false,
                message: 'Error sending email. Please try again later.'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
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
                message: 'Validation failed',
                errors: errors.array()
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
                message: 'Invalid or expired reset token'
            });
        }

        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
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
                message: 'Invalid or expired reset token'
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
            message: 'Server error'
        });
    }
};

module.exports = {
    forgotPassword,
    resetPassword,
    verifyResetToken
};
