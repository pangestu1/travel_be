const { z } = require('zod');

/**
 * User Validation Schemas
 */

// Create user schema (Admin only)
const createUserSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters'),
    email: z.string()
        .email('Invalid email format'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(50, 'Password must be at most 50 characters'),
    role: z.enum(['ADMIN', 'SALES', 'CS', 'MANAGER'])
});

// Update user schema
const updateUserSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .optional(),
    email: z.string()
        .email('Invalid email format')
        .optional(),
    role: z.enum(['ADMIN', 'SALES', 'CS', 'MANAGER'])
        .optional(),
    isActive: z.boolean()
        .optional()
});

// ID param schema
const idParamSchema = z.object({
    id: z.string().transform(val => parseInt(val, 10))
});

module.exports = {
    createUserSchema,
    updateUserSchema,
    idParamSchema
};
