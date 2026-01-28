const { z } = require('zod');

/**
 * Auth Validation Schemas
 */

// Register schema
const registerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters'),
    email: z.string()
        .email('Invalid email format'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(50, 'Password must be at most 50 characters'),
    role: z.enum(['ADMIN', 'SALES', 'CS', 'MANAGER'])
        .optional()
        .default('SALES')
});

// Login schema
const loginSchema = z.object({
    email: z.string()
        .email('Invalid email format'),
    password: z.string()
        .min(1, 'Password is required')
});

// Change password schema
const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Current password is required'),
    newPassword: z.string()
        .min(6, 'New password must be at least 6 characters')
        .max(50, 'New password must be at most 50 characters')
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema
};
