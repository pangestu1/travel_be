const { z } = require('zod');

/**
 * Interaction Validation Schemas
 */

const createInteractionSchema = z.object({
    customerId: z.number()
        .int('Customer ID must be an integer')
        .positive('Customer ID must be positive'),
    type: z.enum(['CALL', 'EMAIL', 'WHATSAPP', 'COMPLAINT', 'FOLLOW_UP', 'OTHER']),
    notes: z.string()
        .max(2000, 'Notes must be at most 2000 characters')
        .optional(),
    followUpDate: z.string()
        .datetime('Invalid follow-up date format')
        .optional()
});

const updateInteractionSchema = z.object({
    type: z.enum(['CALL', 'EMAIL', 'WHATSAPP', 'COMPLAINT', 'FOLLOW_UP', 'OTHER'])
        .optional(),
    notes: z.string()
        .max(2000, 'Notes must be at most 2000 characters')
        .optional(),
    followUpDate: z.string()
        .datetime('Invalid follow-up date format')
        .optional()
        .nullable(),
    isResolved: z.boolean()
        .optional()
});

const idParamSchema = z.object({
    id: z.string().transform(val => parseInt(val, 10))
});

module.exports = {
    createInteractionSchema,
    updateInteractionSchema,
    idParamSchema
};
