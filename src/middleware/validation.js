const { body } = require('express-validator');

const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('city').trim().notEmpty().withMessage('City is required')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

const profileValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('phoneNumber').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('city').optional().trim().notEmpty().withMessage('City cannot be empty')
];

module.exports = {
    registerValidation,
    loginValidation,
    profileValidation
};