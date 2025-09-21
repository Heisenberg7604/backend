const express = require('express');
const { subscribeNewsletter } = require('../controllers/newsletterController');

const router = express.Router();

// Newsletter subscription (public endpoint)
router.post('/subscribe', subscribeNewsletter);

module.exports = router;