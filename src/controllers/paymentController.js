const midtransService = require('../services/midtransService');

/**
 * Payment Controller
 * Handles payment-related HTTP requests and Midtrans webhook
 */

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Midtrans webhook notification handler
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Midtrans notification payload
 *     responses:
 *       200:
 *         description: Notification processed
 */
const handleWebhook = async (req, res, next) => {
    try {
        /**
         * Midtrans sends POST notification with transaction status
         * Example payload:
         * {
         *   "transaction_status": "settlement",
         *   "order_id": "TRV-xxx-123",
         *   "gross_amount": "5000000.00",
         *   "signature_key": "xxxx",
         *   "payment_type": "bank_transfer",
         *   ...
         * }
         */
        const notification = req.body;

        console.log('Received Midtrans webhook:', JSON.stringify(notification, null, 2));

        // Process and verify the notification
        const payment = await midtransService.processNotification(notification);

        res.json({
            success: true,
            message: 'Notification processed',
            data: {
                paymentId: payment.id,
                status: payment.status
            }
        });
    } catch (error) {
        console.error('Webhook error:', error);
        next(error);
    }
};

/**
 * @swagger
 * /api/payments/{orderId}/status:
 *   get:
 *     summary: Get payment status from Midtrans
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
const getPaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const status = await midtransService.getTransactionStatus(orderId);

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleWebhook,
    getPaymentStatus
};
