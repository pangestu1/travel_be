const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient is created
 */
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error']
});

module.exports = prisma;
