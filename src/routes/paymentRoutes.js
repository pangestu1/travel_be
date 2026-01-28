const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { staffOnly } = require('../middlewares/rbacMiddleware');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment and Midtrans webhook endpoints
 */

// Webhook endpoint - NO authentication (Midtrans calls this)
// Important: This endpoint must be public for Midtrans to send notifications
router.post('/webhook', paymentController.handleWebhook);

// Check payment status - requires auth
router.get('/:orderId/status', authenticate, staffOnly, paymentController.getPaymentStatus);

module.exports = router;
