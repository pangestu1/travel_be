const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/authMiddleware');
const { managementOnly } = require('../middlewares/rbacMiddleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reports and analytics (Manager and Admin only)
 */

// All routes require authentication and management role
router.use(authenticate, managementOnly);

// Dashboard overview
router.get('/dashboard', reportController.getDashboard);

// Sales summary
router.get('/sales', reportController.getSalesSummary);

// Booking report
router.get('/bookings', reportController.getBookingReport);

// Customer analytics
router.get('/customers', reportController.getCustomerAnalytics);

// Package performance
router.get('/packages', reportController.getPackagePerformance);

// Export Sales Report (Excel)
router.get('/export/sales', reportController.exportSalesReport);

module.exports = router;
