const { z } = require('zod');

/**
 * Zod Validation Middleware
 * Validates request body, query, or params against a Zod schema
 */

/**
 * Validate request body
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate request query parameters
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate request path parameters
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams
};
