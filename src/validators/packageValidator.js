const { z } = require('zod');

/**
 * Travel Package Validation Schemas
 */

const createPackageSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(200, 'Name must be at most 200 characters'),
    destination: z.string()
        .min(2, 'Destination must be at least 2 characters')
        .max(200, 'Destination must be at most 200 characters'),
    description: z.string()
        .max(5000, 'Description must be at most 5000 characters')
        .optional(),
    price: z.coerce.number()
        .positive('Price must be positive'),
    quota: z.coerce.number()
        .int('Quota must be an integer')
        .positive('Quota must be positive'),
    startDate: z.string()
        .datetime('Invalid start date format'),
    endDate: z.string()
        .datetime('Invalid end date format'),
    imageUrl: z.string()
        .url('Invalid image URL')
        .optional()
});

const updatePackageSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(200, 'Name must be at most 200 characters')
        .optional(),
    destination: z.string()
        .min(2, 'Destination must be at least 2 characters')
        .max(200, 'Destination must be at most 200 characters')
        .optional(),
    description: z.string()
        .max(5000, 'Description must be at most 5000 characters')
        .optional(),
    price: z.coerce.number()
        .positive('Price must be positive')
        .optional(),
    quota: z.coerce.number()
        .int('Quota must be an integer')
        .positive('Quota must be positive')
        .optional(),
    startDate: z.string()
        .datetime('Invalid start date format')
        .optional(),
    endDate: z.string()
        .datetime('Invalid end date format')
        .optional(),
    isActive: z.union([z.boolean(), z.string()])
        .transform(val => val === true || val === 'true')
        .optional(),
    imageUrl: z.string()
        .url('Invalid image URL')
        .optional()
        .nullable()
});

const idParamSchema = z.object({
    id: z.string().transform(val => parseInt(val, 10))
});

module.exports = {
    createPackageSchema,
    updatePackageSchema,
    idParamSchema
};
