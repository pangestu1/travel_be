const prisma = require('../config/database');
const packageService = require('./packageService');
const customerService = require('./customerService');

/**
 * Booking Service
 * Business logic for booking management
 * 
 * Booking Flow:
 * 1. Customer/Sales selects a travel package
 * 2. System checks availability
 * 3. System creates booking with PENDING status
 * 4. Total amount is calculated (price * participants)
 * 5. Payment is initiated via Midtrans
 * 6. After payment success, booking status updates to PAID
 */

/**
 * Get all bookings with pagination
 */
const getAllBookings = async (page = 1, limit = 10, filters = {}) => {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = parseInt(filters.customerId);
    if (filters.packageId) where.packageId = parseInt(filters.packageId);

    if (filters.search) {
        where.OR = [
            { bookingCode: { contains: filters.search } },
            { customer: { name: { contains: filters.search } } },
            { package: { name: { contains: filters.search } } }
        ];
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                package: {
                    select: { id: true, name: true, destination: true, price: true }
                },
                payment: {
                    select: { status: true, paymentType: true, paidAt: true }
                }
            }
        }),
        prisma.booking.count({ where })
    ]);

    return {
        bookings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get booking by ID
 */
const getBookingById = async (id) => {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            customer: true,
            package: true,
            payment: true
        }
    });

    if (!booking) {
        const error = new Error('Booking not found');
        error.statusCode = 404;
        throw error;
    }

    return booking;
};

/**
 * Get booking by booking code
 */
const getBookingByCode = async (bookingCode) => {
    const booking = await prisma.booking.findUnique({
        where: { bookingCode },
        include: {
            customer: true,
            package: true,
            payment: true
        }
    });

    if (!booking) {
        const error = new Error('Booking not found');
        error.statusCode = 404;
        throw error;
    }

    return booking;
};

/**
 * Create a new booking
 * Validates availability and calculates total amount
 */
const createBooking = async (bookingData) => {
    const { customerId, packageId, participants, departureDate, notes } = bookingData;

    // 1. Verify customer exists
    await customerService.getCustomerById(customerId);

    // 2. Get package and verify availability
    const travelPackage = await packageService.getPackageById(packageId);

    // Check if package is active
    if (!travelPackage.isActive) {
        const error = new Error('This travel package is not available');
        error.statusCode = 400;
        throw error;
    }

    // Check availability
    const availability = await packageService.checkAvailability(packageId, participants);
    if (!availability.isAvailable) {
        const error = new Error(`Not enough slots available. Only ${availability.availableSlots} slots left.`);
        error.statusCode = 400;
        throw error;
    }

    // 3. Calculate total amount
    // price is stored as Decimal, convert to number for calculation
    const pricePerPerson = parseFloat(travelPackage.price);
    const totalAmount = pricePerPerson * participants;

    // 4. Create booking
    const booking = await prisma.booking.create({
        data: {
            customerId,
            packageId,
            participants,
            totalAmount,
            departureDate: new Date(departureDate),
            notes,
            status: 'PENDING'
        },
        include: {
            customer: {
                select: { id: true, name: true, email: true }
            },
            package: {
                select: { id: true, name: true, destination: true, price: true }
            }
        }
    });

    return booking;
};

/**
 * Update booking
 */
const updateBooking = async (id, updateData) => {
    const existingBooking = await getBookingById(id);

    // Don't allow updates to PAID, CONFIRMED, or COMPLETED bookings
    if (['PAID', 'CONFIRMED', 'COMPLETED'].includes(existingBooking.status)) {
        const error = new Error('Cannot modify a booking that is already paid or completed');
        error.statusCode = 400;
        throw error;
    }

    // If participants changed, recalculate total
    if (updateData.participants && updateData.participants !== existingBooking.participants) {
        const pricePerPerson = parseFloat(existingBooking.package.price);
        updateData.totalAmount = pricePerPerson * updateData.participants;

        // Check availability for new participant count
        const additional = updateData.participants - existingBooking.participants;
        if (additional > 0) {
            const availability = await packageService.checkAvailability(
                existingBooking.packageId,
                additional
            );
            if (!availability.isAvailable) {
                const error = new Error(`Not enough slots available for additional participants`);
                error.statusCode = 400;
                throw error;
            }
        }
    }

    // Convert date if present
    if (updateData.departureDate) {
        updateData.departureDate = new Date(updateData.departureDate);
    }

    const booking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
            customer: true,
            package: true,
            payment: true
        }
    });

    return booking;
};

/**
 * Cancel booking
 */
const cancelBooking = async (id) => {
    const booking = await getBookingById(id);

    // Don't allow cancellation of COMPLETED bookings
    if (booking.status === 'COMPLETED') {
        const error = new Error('Cannot cancel a completed booking');
        error.statusCode = 400;
        throw error;
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELED' },
        include: {
            customer: true,
            package: true
        }
    });

    return updatedBooking;
};

/**
 * Update booking status (internal use)
 */
const updateBookingStatus = async (id, status) => {
    const booking = await prisma.booking.update({
        where: { id },
        data: { status }
    });

    // Update customer status if booking is paid
    if (status === 'PAID' || status === 'COMPLETED') {
        await customerService.updateCustomerStatus(booking.customerId);
    }

    return booking;
};

module.exports = {
    getAllBookings,
    getBookingById,
    getBookingByCode,
    createBooking,
    updateBooking,
    cancelBooking,
    updateBookingStatus
};
