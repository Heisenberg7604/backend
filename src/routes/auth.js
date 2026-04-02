import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { registerValidation, loginValidation, profileValidation } from '../middleware/validation.js';
import { register, login, getProfile, updateProfile, logout } from '../controllers/authController.js';
import { resetPassword } from '../controllers/passwordController.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, profileValidation, updateProfile);
router.post('/logout', authMiddleware, logout);

export default router;