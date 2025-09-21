const express = require('express');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { trackDownload } = require('../controllers/catalogueController');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Serve catalogue files
router.get('/file/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', 'catalogue', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Catalogue file not found'
            });
        }

        // Set appropriate headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error serving catalogue file:', error);
        res.status(500).json({
            success: false,
            message: 'Error serving catalogue file'
        });
    }
});

// Track download (optional authentication - works for both authenticated and anonymous users)
router.post('/download', optionalAuthMiddleware, trackDownload);

module.exports = router;