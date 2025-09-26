const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { registerValidation, loginValidation, profileValidation } = require('../middleware/validation');
const { register, login, getProfile, updateProfile, logout } = require('../controllers/authController');
const { resetPassword } = require('../controllers/passwordController');

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, profileValidation, updateProfile);
router.post('/logout', authMiddleware, logout);

module.exports = router;