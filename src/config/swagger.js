const swaggerJsdoc = require('swagger-jsdoc');

/**
 * OpenAPI 3.0 Swagger Configuration for Travel CRM API
 */
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Travel CRM API',
            version: '1.0.0',
            description: `
## Travel Company CRM Backend System

This API provides comprehensive functionality for managing:
- **Authentication & Authorization** - JWT-based authentication with RBAC
- **Customer Management** - CRUD operations for travel customers
- **Travel Packages** - Create and manage travel packages
- **Bookings** - Handle customer bookings
- **Payments** - Midtrans Snap integration for payments
- **Interactions** - Customer service interaction logs
- **Reports** - Sales and revenue analytics

### Authentication
All protected endpoints require a Bearer token in the Authorization header.
      `,
            contact: {
                name: 'Travel CRM Support',
                email: 'support@travelcrm.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            },
            schemas: {
                // User schemas
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['ADMIN', 'SALES', 'CS', 'MANAGER'] },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Customer schemas
                Customer: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        address: { type: 'string' },
                        status: { type: 'string', enum: ['PROSPECT', 'ACTIVE', 'LOYAL'] },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Travel Package schemas
                TravelPackage: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        destination: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        quota: { type: 'integer' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean' },
                        imageUrl: { type: 'string' }
                    }
                },
                // Booking schemas
                Booking: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        bookingCode: { type: 'string' },
                        customerId: { type: 'integer' },
                        packageId: { type: 'integer' },
                        participants: { type: 'integer' },
                        totalAmount: { type: 'number' },
                        departureDate: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['PENDING', 'PAID', 'CONFIRMED', 'CANCELED', 'COMPLETED'] },
                        notes: { type: 'string' }
                    }
                },
                // Payment schemas
                Payment: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        bookingId: { type: 'integer' },
                        midtransOrderId: { type: 'string' },
                        amount: { type: 'number' },
                        status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUND'] },
                        paymentType: { type: 'string' },
                        paymentUrl: { type: 'string' }
                    }
                },
                // Interaction schemas
                Interaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        customerId: { type: 'integer' },
                        userId: { type: 'integer' },
                        type: { type: 'string', enum: ['CALL', 'EMAIL', 'WHATSAPP', 'COMPLAINT', 'FOLLOW_UP', 'OTHER'] },
                        notes: { type: 'string' },
                        followUpDate: { type: 'string', format: 'date-time' },
                        isResolved: { type: 'boolean' }
                    }
                },
                // Error response
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        errors: { type: 'array', items: { type: 'object' } }
                    }
                },
                // Success response
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
