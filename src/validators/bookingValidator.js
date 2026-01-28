const { z } = require('zod');

/**
 * Booking Validation Schemas
 */

const createBookingSchema = z.object({
    customerId: z.number()
        .int('Customer ID must be an integer')
        .positive('Customer ID must be positive')
        .optional(),
    packageId: z.number()
        .int('Package ID must be an integer')
        .positive('Package ID must be positive'),
    participants: z.number()
        .int('Participants must be an integer')
        .positive('Participants must be at least 1')
        .default(1),
    departureDate: z.string()
        .datetime('Invalid departure date format'),
    notes: z.string()
        .max(1000, 'Notes must be at most 1000 characters')
        .optional()
});

const updateBookingSchema = z.object({
    participants: z.number()
        .int('Participants must be an integer')
        .positive('Participants must be at least 1')
        .optional(),
    departureDate: z.string()
        .datetime('Invalid departure date format')
        .optional(),
    notes: z.string()
        .max(1000, 'Notes must be at most 1000 characters')
        .optional(),
    status: z.enum(['PENDING', 'PAID', 'CONFIRMED', 'CANCELED', 'COMPLETED'])
        .optional()
});

const idParamSchema = z.object({
    id: z.string().transform(val => parseInt(val, 10))
});

module.exports = {
    createBookingSchema,
    updateBookingSchema,
    idParamSchema
};
