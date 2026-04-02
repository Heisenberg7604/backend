import express from 'express';
import { body } from 'express-validator';
import {
    generatePasswordResetOTP,
    verifyPasswordResetOTP,
    resendPasswordResetOTP
} from '../controllers/otpController.js';

const router = express.Router();

// Validation middleware
const emailValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
];

const otpValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('OTP must be a 6-digit number')
];

// Routes
router.post('/generate-password-reset-otp', emailValidation, generatePasswordResetOTP);
router.post('/verify-password-reset-otp', otpValidation, verifyPasswordResetOTP);
router.post('/resend-password-reset-otp', emailValidation, resendPasswordResetOTP);

export default router;
