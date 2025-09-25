const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { catalogueValidation } = require('../middleware/validation');
const {
    getCatalogues,
    getProducts,
    getCatalogueById,
    uploadCatalogue,
    updateCatalogue,
    deleteCatalogue,
    downloadCatalogue,
    downloadProductCatalogues,
    requestCataloguesByEmail,
    trackDownload
} = require('../controllers/catalogueController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'catalogue');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Public routes (no authentication required)
router.get('/', getCatalogues);
router.get('/products', getProducts);
router.get('/:id', getCatalogueById);

// Download routes with required authentication (to ensure user tracking)
router.get('/:id/download', authMiddleware, downloadCatalogue);
router.get('/product/:productId/download', authMiddleware, downloadProductCatalogues);

// Email request route (optional authentication - works for both logged-in and guest users)
router.post('/request-email', optionalAuthMiddleware, requestCataloguesByEmail);

// Admin routes (require authentication and admin privileges)
router.use(authMiddleware);
router.use(adminMiddleware);

router.post('/upload', upload.single('catalogue'), uploadCatalogue);
router.put('/:id', catalogueValidation, updateCatalogue);
router.delete('/:id', deleteCatalogue);

// Legacy route for tracking downloads
router.post('/download', trackDownload);

module.exports = router;