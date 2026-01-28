const prisma = require('../config/database');

/**
 * Travel Package Service
 * Business logic for travel package management
 */

/**
 * Get all packages with pagination and filters
 */
const getAllPackages = async (page = 1, limit = 10, filters = {}) => {
    const skip = (page - 1) * limit;

    const where = {};

    // Only show active packages to non-admin by default
    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }

    if (filters.destination) {
        where.destination = { contains: filters.destination };
    }

    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search } },
            { destination: { contains: filters.search } },
            { description: { contains: filters.search } }
        ];
    }

    // Filter by date range
    if (filters.startDateFrom) {
        where.startDate = { gte: new Date(filters.startDateFrom) };
    }

    if (filters.maxPrice) {
        where.price = { lte: parseFloat(filters.maxPrice) };
    }

    const [packages, total] = await Promise.all([
        prisma.travelPackage.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startDate: 'asc' },
            include: {
                _count: {
                    select: { bookings: true }
                }
            }
        }),
        prisma.travelPackage.count({ where })
    ]);

    return {
        packages,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get package by ID with booking count
 */
const getPackageById = async (id) => {
    const travelPackage = await prisma.travelPackage.findUnique({
        where: { id },
        include: {
            _count: {
                select: { bookings: true }
            },
            bookings: {
                where: {
                    status: { in: ['PENDING', 'PAID', 'CONFIRMED'] }
                },
                select: {
                    participants: true
                }
            }
        }
    });

    if (!travelPackage) {
        const error = new Error('Travel package not found');
        error.statusCode = 404;
        throw error;
    }

    // Calculate available slots
    const bookedParticipants = travelPackage.bookings.reduce(
        (sum, booking) => sum + booking.participants,
        0
    );

    const packageData = {
        ...travelPackage,
        bookedParticipants,
        availableSlots: travelPackage.quota - bookedParticipants
    };
    delete packageData.bookings;

    return packageData;
};

/**
 * Create a new travel package (Admin only)
 */
const createPackage = async (packageData) => {
    const travelPackage = await prisma.travelPackage.create({
        data: {
            name: packageData.name,
            destination: packageData.destination,
            description: packageData.description,
            price: packageData.price,
            quota: packageData.quota,
            startDate: new Date(packageData.startDate),
            endDate: new Date(packageData.endDate),
            imageUrl: packageData.imageUrl
        }
    });

    return travelPackage;
};

/**
 * Update travel package (Admin only)
 */
const updatePackage = async (id, updateData) => {
    // Convert date strings to Date objects if present
    if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
    }

    const travelPackage = await prisma.travelPackage.update({
        where: { id },
        data: updateData
    });

    return travelPackage;
};

/**
 * Deactivate package (soft delete)
 */
const deactivatePackage = async (id) => {
    const travelPackage = await prisma.travelPackage.update({
        where: { id },
        data: { isActive: false }
    });

    return travelPackage;
};

/**
 * Delete package (hard delete - use with caution)
 */
const deletePackage = async (id) => {
    // Check if package has bookings
    const bookingsCount = await prisma.booking.count({
        where: { packageId: id }
    });

    if (bookingsCount > 0) {
        const error = new Error('Cannot delete package with existing bookings. Deactivate instead.');
        error.statusCode = 400;
        throw error;
    }

    await prisma.travelPackage.delete({
        where: { id }
    });
};

/**
 * Check package availability
 */
const checkAvailability = async (packageId, participants) => {
    const travelPackage = await prisma.travelPackage.findUnique({
        where: { id: packageId },
        include: {
            bookings: {
                where: {
                    status: { in: ['PENDING', 'PAID', 'CONFIRMED'] }
                },
                select: {
                    participants: true
                }
            }
        }
    });

    if (!travelPackage) {
        const error = new Error('Travel package not found');
        error.statusCode = 404;
        throw error;
    }

    if (!travelPackage.isActive) {
        const error = new Error('Travel package is not available');
        error.statusCode = 400;
        throw error;
    }

    const bookedParticipants = travelPackage.bookings.reduce(
        (sum, booking) => sum + booking.participants,
        0
    );

    const availableSlots = travelPackage.quota - bookedParticipants;

    return {
        isAvailable: availableSlots >= participants,
        availableSlots,
        requestedParticipants: participants
    };
};

module.exports = {
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deactivatePackage,
    deletePackage,
    checkAvailability
};
