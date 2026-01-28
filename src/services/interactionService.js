const prisma = require('../config/database');

/**
 * Interaction Service
 * Business logic for customer service interaction logs
 * 
 * Used by CS team to:
 * - Record customer calls, emails, WhatsApp messages
 * - Log complaints and resolutions
 * - Schedule and track follow-ups
 */

/**
 * Get all interactions with pagination
 */
const getAllInteractions = async (page = 1, limit = 10, filters = {}) => {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.customerId) where.customerId = parseInt(filters.customerId);
    if (filters.userId) where.userId = parseInt(filters.userId);
    if (filters.type) where.type = filters.type;
    if (filters.isResolved !== undefined) where.isResolved = filters.isResolved;

    // Filter for pending follow-ups
    if (filters.pendingFollowUp) {
        where.followUpDate = { lte: new Date() };
        where.isResolved = false;
    }

    const [interactions, total] = await Promise.all([
        prisma.interaction.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                user: {
                    select: { id: true, name: true }
                }
            }
        }),
        prisma.interaction.count({ where })
    ]);

    return {
        interactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get interaction by ID
 */
const getInteractionById = async (id) => {
    const interaction = await prisma.interaction.findUnique({
        where: { id },
        include: {
            customer: true,
            user: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    if (!interaction) {
        const error = new Error('Interaction not found');
        error.statusCode = 404;
        throw error;
    }

    return interaction;
};

/**
 * Create a new interaction log
 */
const createInteraction = async (interactionData, userId) => {
    const interaction = await prisma.interaction.create({
        data: {
            customerId: interactionData.customerId,
            userId,  // CS user who is logging this
            type: interactionData.type,
            notes: interactionData.notes,
            followUpDate: interactionData.followUpDate
                ? new Date(interactionData.followUpDate)
                : null
        },
        include: {
            customer: {
                select: { id: true, name: true }
            },
            user: {
                select: { id: true, name: true }
            }
        }
    });

    return interaction;
};

/**
 * Update interaction
 */
const updateInteraction = async (id, updateData) => {
    if (updateData.followUpDate) {
        updateData.followUpDate = new Date(updateData.followUpDate);
    }

    const interaction = await prisma.interaction.update({
        where: { id },
        data: updateData,
        include: {
            customer: true,
            user: {
                select: { id: true, name: true }
            }
        }
    });

    return interaction;
};

/**
 * Mark interaction as resolved
 */
const resolveInteraction = async (id) => {
    const interaction = await prisma.interaction.update({
        where: { id },
        data: { isResolved: true }
    });

    return interaction;
};

/**
 * Get pending follow-ups for a user
 */
const getPendingFollowUps = async (userId) => {
    const followUps = await prisma.interaction.findMany({
        where: {
            userId,
            isResolved: false,
            followUpDate: {
                lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
            }
        },
        orderBy: { followUpDate: 'asc' },
        include: {
            customer: {
                select: { id: true, name: true, phone: true, email: true }
            }
        }
    });

    return followUps;
};

/**
 * Get interactions by customer
 */
const getCustomerInteractions = async (customerId) => {
    const interactions = await prisma.interaction.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true }
            }
        }
    });

    return interactions;
};

module.exports = {
    getAllInteractions,
    getInteractionById,
    createInteraction,
    updateInteraction,
    resolveInteraction,
    getPendingFollowUps,
    getCustomerInteractions
};
