const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middlewares/authMiddleware');
const { staffOnly, salesAndAdmin, authorize, roles } = require('../middlewares/rbacMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateMiddleware');
const { createBookingSchema, updateBookingSchema, idParamSchema } = require('../validators/bookingValidator');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

// All routes require authentication
router.use(authenticate);

// GET routes
// Allow Customer to view their own bookings
router.get('/', authorize(roles.ADMIN, roles.SALES, roles.CS, roles.MANAGER, 'CUSTOMER'), bookingController.getAllBookings);
router.get('/:id', authorize(roles.ADMIN, roles.SALES, roles.CS, roles.MANAGER, 'CUSTOMER'), validateParams(idParamSchema), bookingController.getBookingById);
router.get('/code/:code', staffOnly, bookingController.getBookingByCode);

// Create booking - Sales, Admin, AND Customer
router.post('/', authorize(roles.ADMIN, roles.SALES, 'CUSTOMER'), validateBody(createBookingSchema), bookingController.createBooking);

// Update booking - Sales and Admin
router.put('/:id', salesAndAdmin, validateParams(idParamSchema), validateBody(updateBookingSchema), bookingController.updateBooking);

// Cancel booking - Sales and Admin (maybe Customer too? stick to Sales/Admin for now)
router.patch('/:id/cancel', salesAndAdmin, validateParams(idParamSchema), bookingController.cancelBooking);

// Initiate payment - Staff and Customer
router.post('/:id/pay', authorize(roles.ADMIN, roles.SALES, roles.CS, 'CUSTOMER'), validateParams(idParamSchema), bookingController.initiatePayment);

// Download Invoice - Staff and Customer
router.get('/:id/invoice', authorize(roles.ADMIN, roles.SALES, roles.CS, 'CUSTOMER'), validateParams(idParamSchema), bookingController.downloadInvoice);

module.exports = router;
