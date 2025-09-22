const express = require('express');
const {
    subscribeNewsletter,
    unsubscribeNewsletter,
    getNewsletterSubscribers,
    updateSubscriberStatus,
    exportNewsletterSubscribers
} = require('../controllers/newsletterController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { newsletterValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/subscribe', newsletterValidation, subscribeNewsletter);
router.get('/unsubscribe/:token', unsubscribeNewsletter);

// Admin routes (require authentication and admin privileges)
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/subscribers', getNewsletterSubscribers);
router.put('/subscribers/:id/status', updateSubscriberStatus);
router.get('/export', exportNewsletterSubscribers);

module.exports = router;