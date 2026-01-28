const { z } = require('zod');

/**
 * Customer Validation Schemas
 */

const createCustomerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters'),
    email: z.string()
        .email('Invalid email format'),
    phone: z.string()
        .max(20, 'Phone must be at most 20 characters')
        .optional(),
    address: z.string()
        .max(500, 'Address must be at most 500 characters')
        .optional(),
    status: z.enum(['PROSPECT', 'ACTIVE', 'LOYAL'])
        .optional()
        .default('PROSPECT')
});

const updateCustomerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .optional(),
    email: z.string()
        .email('Invalid email format')
        .optional(),
    phone: z.string()
        .max(20, 'Phone must be at most 20 characters')
        .optional(),
    address: z.string()
        .max(500, 'Address must be at most 500 characters')
        .optional(),
    status: z.enum(['PROSPECT', 'ACTIVE', 'LOYAL'])
        .optional()
});

const idParamSchema = z.object({
    id: z.string().transform(val => parseInt(val, 10))
});

module.exports = {
    createCustomerSchema,
    updateCustomerSchema,
    idParamSchema
};
