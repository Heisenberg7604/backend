import { body } from 'express-validator';

export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('city').trim().notEmpty().withMessage('City is required')
];

export const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

export const profileValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('phoneNumber').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('city').optional().trim().notEmpty().withMessage('City cannot be empty')
];

export const newsletterValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('phoneNumber').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('city').optional().trim().notEmpty().withMessage('City cannot be empty')
];

export const createUserValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin')
];

export const updateUserValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('phoneNumber').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

export const catalogueValidation = [
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty')
];