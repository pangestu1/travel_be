const bookingService = require('../services/bookingService');
const midtransService = require('../services/midtransService');
const exportService = require('../services/exportService');
const prisma = require('../config/database'); // Needed for direct checks if any

/**
 * Booking Controller
 * Handles HTTP requests for booking management
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, CONFIRMED, CANCELED, COMPLETED]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bookings
 */
const getAllBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, packageId, search } = req.query;

        const filters = { status, packageId, search };

        // If Customer, force filter by their ID
        if (req.user.type === 'CUSTOMER') {
            filters.customerId = req.user.id;
        } else if (req.query.customerId) {
            filters.customerId = req.query.customerId;
        }

        const result = await bookingService.getAllBookings(
            parseInt(page),
            parseInt(limit),
            filters
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
const getBookingById = async (req, res, next) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id);

        // Ownership check for Customer
        if (req.user.type === 'CUSTOMER' && booking.customerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/bookings/code/{code}:
 *   get:
 *     summary: Get booking by booking code
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 */
const getBookingByCode = async (req, res, next) => {
    try {
        const booking = await bookingService.getBookingByCode(req.params.code);

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - packageId
 *               - departureDate
 *             properties:
 *               customerId:
 *                 type: integer
 *               packageId:
 *                 type: integer
 *               participants:
 *                 type: integer
 *                 default: 1
 *               departureDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 */
const createBooking = async (req, res, next) => {
    try {
        // Check if user is a Customer
        if (req.user.type === 'CUSTOMER') {
            // Force customerId to be their own ID
            req.body.customerId = req.user.id;
        } else {
            // Staff must provide customerId
            if (!req.body.customerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Customer ID is required'
                });
            }
        }

        const booking = await bookingService.createBooking(req.body);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking updated
 */
const updateBooking = async (req, res, next) => {
    try {
        const booking = await bookingService.updateBooking(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Booking updated successfully',
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking canceled
 */
const cancelBooking = async (req, res, next) => {
    try {
        const booking = await bookingService.cancelBooking(req.params.id);

        res.json({
            success: true,
            message: 'Booking canceled successfully',
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/bookings/{id}/pay:
 *   post:
 *     summary: Initiate payment
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment initiated
 */
const initiatePayment = async (req, res, next) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id);

        // Ownership check for Customer
        if (req.user.type === 'CUSTOMER' && booking.customerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking is in PENDING status
        if (booking.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Payment can only be initiated for pending bookings'
            });
        }

        // Check if payment already exists
        if (booking.payment && booking.payment.status === 'PENDING') {
            return res.json({
                success: true,
                message: 'Payment already initiated',
                data: {
                    snapToken: booking.payment.midtransToken,
                    redirectUrl: booking.payment.paymentUrl
                }
            });
        }

        // Create Midtrans Snap transaction
        const result = await midtransService.createSnapTransaction(booking);

        res.json({
            success: true,
            message: 'Payment initiated successfully',
            data: {
                snapToken: result.snapToken,
                redirectUrl: result.redirectUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/bookings/{id}/invoice:
 *   get:
 *     summary: Download Invoice PDF
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF File
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
const downloadInvoice = async (req, res, next) => {
    try {
        const bookingId = req.params.id;

        // Ownership Check
        if (req.user.type === 'CUSTOMER') {
            const booking = await bookingService.getBookingById(bookingId);

            if (booking.customerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${bookingId}.pdf`);

        await exportService.generateInvoicePDF(bookingId, res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBookings,
    getBookingById,
    getBookingByCode,
    createBooking,
    updateBooking,
    cancelBooking,
    initiatePayment,
    downloadInvoice
};
