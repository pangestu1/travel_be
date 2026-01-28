const reportService = require('../services/reportService');
const exportService = require('../services/exportService');

/**
 * Report Controller
 * Handles HTTP requests for reports and analytics (Manager only)
 */

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard overview stats
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
const getDashboard = async (req, res, next) => {
    try {
        const stats = await reportService.getDashboardStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Get sales summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales summary
 */
const getSalesSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getSalesSummary(startDate, endDate);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/reports/bookings:
 *   get:
 *     summary: Get detailed booking report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking report
 */
const getBookingReport = async (req, res, next) => {
    try {
        const { startDate, endDate, status } = req.query;
        const report = await reportService.getBookingReport(
            startDate,
            endDate,
            status ? { status } : {}
        );

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/reports/customers:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer analytics
 */
const getCustomerAnalytics = async (req, res, next) => {
    try {
        const analytics = await reportService.getCustomerAnalytics();

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/reports/packages:
 *   get:
 *     summary: Get package performance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Package performance report
 */
const getPackagePerformance = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getPackagePerformance(startDate, endDate);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/reports/export/sales:
 *   get:
 *     summary: Export Sales Report to Excel
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
const exportSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const workbook = await exportService.generateSalesExcel(startDate, endDate);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getSalesSummary,
    getBookingReport,
    getCustomerAnalytics,
    getPackagePerformance,
    exportSalesReport
};
