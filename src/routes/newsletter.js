import express from 'express';
import {
    subscribeNewsletter,
    unsubscribeNewsletter,
    getNewsletterSubscribers,
    updateSubscriberStatus,
    exportNewsletterSubscribers
} from '../controllers/newsletterController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { newsletterValidation } from '../middleware/validation.js';

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

export default router;