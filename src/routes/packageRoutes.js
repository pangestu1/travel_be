const express = require('express');
const router = express.Router();

const packageController = require('../controllers/packageController');
const { authenticate, optionalAuth } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/rbacMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateMiddleware');
const { createPackageSchema, updatePackageSchema, idParamSchema } = require('../validators/packageValidator');

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Travel package management
 */

// Public routes (with optional auth for potential user-specific features)
router.get('/', optionalAuth, packageController.getAllPackages);
router.get('/:id', optionalAuth, validateParams(idParamSchema), packageController.getPackageById);
router.get('/:id/availability', validateParams(idParamSchema), packageController.checkAvailability);

const upload = require('../middlewares/uploadMiddleware');

// Admin-only routes
router.post('/', authenticate, adminOnly, upload.single('image'), validateBody(createPackageSchema), packageController.createPackage);
router.put('/:id', authenticate, adminOnly, upload.single('image'), validateParams(idParamSchema), validateBody(updatePackageSchema), packageController.updatePackage);
router.delete('/:id', authenticate, adminOnly, validateParams(idParamSchema), packageController.deletePackage);
router.patch('/:id/deactivate', authenticate, adminOnly, validateParams(idParamSchema), packageController.deactivatePackage);

module.exports = router;
