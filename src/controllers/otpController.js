const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOTPEmail } = require('../services/emailService');
const logActivity = require('../utils/logActivity');

// Generate OTP for password reset
const generatePasswordResetOTP = async (req, res) => {
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
                message: 'If an account with that email exists, we have sent an OTP.',
                data: {
                    email: email,
                    expiresIn: 300
                }
            });
        }

        // Generate 6-digit OTP
        const otp = speakeasy.totp({
            secret: process.env.OTP_SECRET || 'fallback-secret-key-for-otp-generation',
            encoding: 'base32',
            step: 300, // 5 minutes
            window: 1
        });

        // Generate a more secure OTP using crypto
        const crypto = require('crypto');
        const secureOTP = crypto.randomInt(100000, 999999).toString();

        // Set OTP expiration (5 minutes)
        const otpExpires = Date.now() + 5 * 60 * 1000;

        user.passwordResetOTP = secureOTP;
        user.passwordResetOTPExpires = otpExpires;
        await user.save();

        // Send OTP via email
        try {
            const emailResult = await sendOTPEmail({
                to: email,
                otp: secureOTP,
                userName: user.name
            });

            if (emailResult.success) {
                // Log OTP generation activity
                await logActivity({
                    type: 'password_reset_otp_generated',
                    userId: user._id,
                    details: { email: user.email },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.json({
                    success: true,
                    message: 'If an account with that email exists, we have sent an OTP.',
                    data: {
                        email: email, // For frontend to know which email to verify
                        expiresIn: 300 // 5 minutes in seconds
                    }
                });
            } else {
                throw new Error(emailResult.error);
            }

        } catch (emailError) {
            console.error('Email sending error:', emailError);

            // Clear the OTP if email fails
            user.passwordResetOTP = undefined;
            user.passwordResetOTPExpires = undefined;
            await user.save();

            res.status(500).json({
                success: false,
                message: 'Error sending OTP. Please try again later.',
                error: emailError.message
            });
        }

    } catch (error) {
        console.error('Generate OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Verify OTP for password reset
const verifyPasswordResetOTP = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            passwordResetOTP: otp,
            passwordResetOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Generate a temporary token for password reset
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        user.passwordResetOTP = undefined;
        user.passwordResetOTPExpires = undefined;
        await user.save();

        // Log OTP verification activity
        await logActivity({
            type: 'password_reset_otp_verified',
            userId: user._id,
            details: { email: user.email },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                resetToken,
                expiresIn: 600 // 10 minutes in seconds
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Resend OTP
const resendPasswordResetOTP = async (req, res) => {
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
            return res.json({
                success: true,
                message: 'If an account with that email exists, we have sent a new OTP.'
            });
        }

        // Check if there's already a valid OTP (prevent spam)
        if (user.passwordResetOTP && user.passwordResetOTPExpires > Date.now()) {
            const timeLeft = Math.ceil((user.passwordResetOTPExpires - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new OTP.`
            });
        }

        // Generate new OTP
        const crypto = require('crypto');
        const secureOTP = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

        user.passwordResetOTP = secureOTP;
        user.passwordResetOTPExpires = otpExpires;
        await user.save();

        // Send new OTP via email
        try {
            const emailResult = await sendOTPEmail({
                to: email,
                otp: secureOTP,
                userName: user.name
            });

            if (emailResult.success) {
                // Log OTP resend activity
                await logActivity({
                    type: 'password_reset_otp_resent',
                    userId: user._id,
                    details: { email: user.email },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.json({
                    success: true,
                    message: 'New OTP sent successfully',
                    data: {
                        email: email,
                        expiresIn: 300 // 5 minutes in seconds
                    }
                });
            } else {
                throw new Error(emailResult.error);
            }

        } catch (emailError) {
            console.error('Email sending error:', emailError);

            // Clear the OTP if email fails
            user.passwordResetOTP = undefined;
            user.passwordResetOTPExpires = undefined;
            await user.save();

            res.status(500).json({
                success: false,
                message: 'Error sending OTP. Please try again later.',
                error: emailError.message
            });
        }

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    generatePasswordResetOTP,
    verifyPasswordResetOTP,
    resendPasswordResetOTP
};
