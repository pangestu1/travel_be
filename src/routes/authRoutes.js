const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication for Staff and Customers
 */

// Staff Auth
router.post('/login', authController.login);
router.post('/change-password', authenticate, authController.changePassword);

// Customer Auth
router.post('/customer/register', customerAuthController.register);
router.post('/customer/login', customerAuthController.login);

module.exports = router;
