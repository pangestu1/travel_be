const bcrypt = require('bcrypt');
const prisma = require('../config/database');

/**
 * User Service
 * Business logic for user management (Admin only)
 */

const SALT_ROUNDS = 10;

/**
 * Get all users with pagination
 */
const getAllUsers = async (page = 1, limit = 10, filters = {}) => {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search } },
            { email: { contains: filters.search } }
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        }),
        prisma.user.count({ where })
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Create a new user (Admin only)
 */
const createUser = async (userData) => {
    const { name, email, password, role } = userData;

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
        }
    });

    return user;
};

/**
 * Update user
 */
const updateUser = async (id, updateData) => {
    const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            updatedAt: true
        }
    });

    return user;
};

/**
 * Deactivate user (soft delete)
 */
const deactivateUser = async (id) => {
    const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: {
            id: true,
            name: true,
            email: true,
            isActive: true
        }
    });

    return user;
};

/**
 * Delete user (hard delete - use with caution)
 */
const deleteUser = async (id) => {
    await prisma.user.delete({
        where: { id }
    });
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deactivateUser,
    deleteUser
};
