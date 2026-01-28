const midtransClient = require('midtrans-client');
const prisma = require('../config/database');
const crypto = require('crypto');

/**
 * Midtrans Service
 * Handles Midtrans Snap API integration for payment processing
 * 
 * Payment Flow:
 * 1. Backend creates Snap transaction with booking details
 * 2. Midtrans returns snap_token and redirect_url
 * 3. Frontend uses snap_token to show payment popup
 * 4. Customer completes payment
 * 5. Midtrans sends webhook notification
 * 6. Backend verifies signature and updates payment/booking status
 */

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

/**
 * Create Midtrans Snap transaction for a booking
 * @param {Object} booking - Booking data with customer and package info
 * @returns {Object} Payment record with snap token and URL
 */
const createSnapTransaction = async (booking) => {
    // Generate unique order ID
    const orderId = `TRV-${booking.bookingCode}-${Date.now()}`;

    // Prepare transaction details for Midtrans
    const transactionDetails = {
        order_id: orderId,
        gross_amount: parseInt(booking.totalAmount) // Midtrans requires integer
    };

    // Customer details
    const customerDetails = {
        first_name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone || ''
    };

    // Item details for receipt
    const itemDetails = [
        {
            id: `PKG-${booking.packageId}`,
            name: booking.package.name,
            price: parseInt(booking.package.price),
            quantity: booking.participants,
            category: 'Travel Package'
        }
    ];

    // Snap transaction parameters
    const parameter = {
        transaction_details: transactionDetails,
        customer_details: customerDetails,
        item_details: itemDetails,
        // Set expiry (24 hours)
        expiry: {
            unit: 'hours',
            duration: 24
        },
        // Callbacks
        callbacks: {
            finish: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/booking/finish`,
            error: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/booking/error`,
            pending: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/booking/pending`
        }
    };

    try {
        // Create Midtrans transaction
        const transaction = await snap.createTransaction(parameter);

        // Calculate expiry time (24 hours from now)
        const expiredAt = new Date();
        expiredAt.setHours(expiredAt.getHours() + 24);

        // Create payment record in database
        const payment = await prisma.payment.create({
            data: {
                bookingId: booking.id,
                midtransOrderId: orderId,
                midtransToken: transaction.token,
                paymentUrl: transaction.redirect_url,
                amount: booking.totalAmount,
                status: 'PENDING',
                expiredAt
            }
        });

        return {
            payment,
            snapToken: transaction.token,
            redirectUrl: transaction.redirect_url
        };
    } catch (error) {
        console.error('Midtrans Error:', error);
        const err = new Error('Failed to create payment transaction');
        err.statusCode = 500;
        throw err;
    }
};

/**
 * Verify Midtrans webhook signature
 * Signature Key = SHA512(order_id + status_code + gross_amount + ServerKey)
 * 
 * @param {Object} notification - Midtrans notification payload
 * @returns {boolean} Is signature valid
 */
const verifySignature = (notification) => {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // Create signature hash
    const hash = crypto
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest('hex');

    return hash === signature_key;
};

/**
 * Process Midtrans webhook notification
 * Updates payment and booking status based on transaction result
 * 
 * @param {Object} notification - Midtrans notification payload
 */
const processNotification = async (notification) => {
    const {
        order_id,
        transaction_status,
        fraud_status,
        payment_type
    } = notification;

    // Verify signature first
    if (!verifySignature(notification)) {
        const error = new Error('Invalid signature');
        error.statusCode = 403;
        throw error;
    }

    // Find payment by Midtrans order ID
    const payment = await prisma.payment.findUnique({
        where: { midtransOrderId: order_id },
        include: { booking: true }
    });

    if (!payment) {
        const error = new Error('Payment not found');
        error.statusCode = 404;
        throw error;
    }

    // Determine payment status based on transaction_status and fraud_status
    let paymentStatus = 'PENDING';
    let bookingStatus = payment.booking.status;

    if (transaction_status === 'capture') {
        // For credit card payments
        if (fraud_status === 'accept') {
            paymentStatus = 'SUCCESS';
            bookingStatus = 'PAID';
        } else if (fraud_status === 'challenge') {
            // Manual review required
            paymentStatus = 'PENDING';
        }
    } else if (transaction_status === 'settlement') {
        // Payment settled
        paymentStatus = 'SUCCESS';
        bookingStatus = 'PAID';
    } else if (transaction_status === 'pending') {
        // Waiting for payment
        paymentStatus = 'PENDING';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
        paymentStatus = 'FAILED';
        bookingStatus = 'CANCELED';
    } else if (transaction_status === 'expire') {
        paymentStatus = 'EXPIRED';
        bookingStatus = 'CANCELED';
    } else if (transaction_status === 'refund') {
        paymentStatus = 'REFUND';
    }

    // Update payment record
    const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: paymentStatus,
            paymentType: payment_type,
            paidAt: paymentStatus === 'SUCCESS' ? new Date() : null
        }
    });

    // Update booking status if changed
    if (bookingStatus !== payment.booking.status) {
        await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: bookingStatus }
        });

        // Update customer status if booking is paid
        if (bookingStatus === 'PAID') {
            const customerService = require('./customerService');
            await customerService.updateCustomerStatus(payment.booking.customerId);
        }
    }

    return updatedPayment;
};

/**
 * Get payment status from Midtrans
 * @param {string} orderId - Midtrans order ID
 */
const getTransactionStatus = async (orderId) => {
    try {
        const status = await snap.transaction.status(orderId);
        return status;
    } catch (error) {
        console.error('Midtrans Status Error:', error);
        throw error;
    }
};

module.exports = {
    createSnapTransaction,
    verifySignature,
    processNotification,
    getTransactionStatus
};
