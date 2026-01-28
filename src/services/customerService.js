const prisma = require('../config/database');

/**
 * Customer Service
 * Business logic for customer management
 */

/**
 * Get all customers with pagination and filters
 */
const getAllCustomers = async (page = 1, limit = 10, filters = {}) => {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search } },
            { email: { contains: filters.search } },
            { phone: { contains: filters.search } }
        ];
    }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { bookings: true, interactions: true }
                }
            }
        }),
        prisma.customer.count({ where })
    ]);

    return {
        customers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get customer by ID with related data
 */
const getCustomerById = async (id) => {
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            bookings: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    package: {
                        select: { name: true, destination: true }
                    }
                }
            },
            interactions: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
    }

    return customer;
};

/**
 * Create a new customer
 */
const createCustomer = async (customerData) => {
    const customer = await prisma.customer.create({
        data: customerData
    });

    return customer;
};

/**
 * Update customer
 */
const updateCustomer = async (id, updateData) => {
    const customer = await prisma.customer.update({
        where: { id },
        data: updateData
    });

    return customer;
};

/**
 * Delete customer
 */
const deleteCustomer = async (id) => {
    // Check if customer has bookings
    const bookingsCount = await prisma.booking.count({
        where: { customerId: id }
    });

    if (bookingsCount > 0) {
        const error = new Error('Cannot delete customer with existing bookings');
        error.statusCode = 400;
        throw error;
    }

    await prisma.customer.delete({
        where: { id }
    });
};

/**
 * Update customer status based on booking activity
 * Called after booking completion
 */
const updateCustomerStatus = async (customerId) => {
    const bookingsCount = await prisma.booking.count({
        where: {
            customerId,
            status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] }
        }
    });

    let newStatus = 'PROSPECT';
    if (bookingsCount >= 3) {
        newStatus = 'LOYAL';
    } else if (bookingsCount >= 1) {
        newStatus = 'ACTIVE';
    }

    await prisma.customer.update({
        where: { id: customerId },
        data: { status: newStatus }
    });
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerStatus
};
