const prisma = require('../config/database');

/**
 * Report Service
 * Business logic for generating reports and analytics for Managers
 */

/**
 * Get sales summary report
 * Revenue, booking counts, payment status breakdown
 */
const getSalesSummary = async (startDate, endDate) => {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {};
    if (startDate || endDate) {
        where.createdAt = dateFilter;
    }

    // Get booking stats
    const bookingStats = await prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true }
    });

    // Get total revenue (only from PAID/CONFIRMED/COMPLETED bookings)
    const revenue = await prisma.booking.aggregate({
        where: {
            ...where,
            status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
    });

    // Get payment method breakdown
    const paymentMethods = await prisma.payment.groupBy({
        by: ['paymentType'],
        where: {
            status: 'SUCCESS',
            ...(startDate || endDate ? { createdAt: dateFilter } : {})
        },
        _count: { id: true },
        _sum: { amount: true }
    });

    return {
        period: { startDate, endDate },
        totalRevenue: revenue._sum.totalAmount || 0,
        totalPaidBookings: revenue._count.id,
        bookingsByStatus: bookingStats.map(stat => ({
            status: stat.status,
            count: stat._count.id,
            totalAmount: stat._sum.totalAmount || 0
        })),
        paymentMethods: paymentMethods
            .filter(p => p.paymentType)
            .map(method => ({
                type: method.paymentType,
                count: method._count.id,
                totalAmount: method._sum.amount || 0
            }))
    };
};

/**
 * Get booking report with details
 */
const getBookingReport = async (startDate, endDate, filters = {}) => {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { ...filters };
    if (startDate || endDate) {
        where.createdAt = dateFilter;
    }

    const bookings = await prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            customer: {
                select: { name: true, email: true }
            },
            package: {
                select: { name: true, destination: true, price: true }
            },
            payment: {
                select: { status: true, paymentType: true, paidAt: true }
            }
        }
    });

    // Summary stats
    const summary = {
        totalBookings: bookings.length,
        totalRevenue: bookings
            .filter(b => ['PAID', 'CONFIRMED', 'COMPLETED'].includes(b.status))
            .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0),
        totalParticipants: bookings.reduce((sum, b) => sum + b.participants, 0)
    };

    return {
        period: { startDate, endDate },
        summary,
        bookings
    };
};

/**
 * Get customer analytics
 */
const getCustomerAnalytics = async () => {
    // Customer status breakdown
    const customersByStatus = await prisma.customer.groupBy({
        by: ['status'],
        _count: { id: true }
    });

    // Top customers by booking count
    const topCustomers = await prisma.customer.findMany({
        take: 10,
        orderBy: {
            bookings: {
                _count: 'desc'
            }
        },
        include: {
            _count: {
                select: { bookings: true }
            },
            bookings: {
                where: { status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] } },
                select: { totalAmount: true }
            }
        }
    });

    return {
        customersByStatus: customersByStatus.map(stat => ({
            status: stat.status,
            count: stat._count.id
        })),
        topCustomers: topCustomers.map(customer => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            status: customer.status,
            totalBookings: customer._count.bookings,
            totalSpent: customer.bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0)
        }))
    };
};

/**
 * Get package performance report
 */
const getPackagePerformance = async (startDate, endDate) => {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const packages = await prisma.travelPackage.findMany({
        include: {
            bookings: {
                where: startDate || endDate ? { createdAt: dateFilter } : {},
                select: {
                    id: true,
                    participants: true,
                    totalAmount: true,
                    status: true
                }
            }
        }
    });

    return packages.map(pkg => {
        const paidBookings = pkg.bookings.filter(b =>
            ['PAID', 'CONFIRMED', 'COMPLETED'].includes(b.status)
        );

        return {
            id: pkg.id,
            name: pkg.name,
            destination: pkg.destination,
            price: pkg.price,
            quota: pkg.quota,
            isActive: pkg.isActive,
            totalBookings: pkg.bookings.length,
            paidBookings: paidBookings.length,
            totalParticipants: paidBookings.reduce((sum, b) => sum + b.participants, 0),
            totalRevenue: paidBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0),
            occupancyRate: pkg.quota > 0
                ? (paidBookings.reduce((sum, b) => sum + b.participants, 0) / pkg.quota * 100).toFixed(2)
                : 0
        };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/**
 * Get dashboard overview stats
 */
const getDashboardStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // This month stats
    const thisMonthRevenue = await prisma.booking.aggregate({
        where: {
            status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
            createdAt: { gte: thisMonth }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
    });

    // Last month stats for comparison
    const lastMonthRevenue = await prisma.booking.aggregate({
        where: {
            status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
            createdAt: { gte: lastMonth, lte: lastMonthEnd }
        },
        _sum: { totalAmount: true }
    });

    // Pending bookings
    const pendingBookings = await prisma.booking.count({
        where: { status: 'PENDING' }
    });

    // Active customers
    const activeCustomers = await prisma.customer.count({
        where: { status: { in: ['ACTIVE', 'LOYAL'] } }
    });

    // Active packages
    const activePackages = await prisma.travelPackage.count({
        where: { isActive: true }
    });

    // Unresolved interactions
    const unresolvedInteractions = await prisma.interaction.count({
        where: { isResolved: false }
    });

    return {
        thisMonth: {
            revenue: thisMonthRevenue._sum.totalAmount || 0,
            bookings: thisMonthRevenue._count.id
        },
        lastMonth: {
            revenue: lastMonthRevenue._sum.totalAmount || 0
        },
        pendingBookings,
        activeCustomers,
        activePackages,
        unresolvedInteractions
    };
};

module.exports = {
    getSalesSummary,
    getBookingReport,
    getCustomerAnalytics,
    getPackagePerformance,
    getDashboardStats
};
