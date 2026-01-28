const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Authentication Service
 * Handles business logic for user authentication
 */

const SALT_ROUNDS = 10;

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user (without password)
 */
const register = async (userData) => {
    const { name, email, password, role } = userData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || 'SALES'
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
 * Login user and generate JWT token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User data and JWT token
 */
const login = async (email, password) => {
    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('Account is deactivated');
        error.statusCode = 403;
        throw error;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password) and token
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    };
};

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
};

/**
 * Get user profile
 * @param {number} userId - User ID
 * @returns {Object} User profile
 */
const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
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

module.exports = {
    register,
    login,
    changePassword,
    getProfile
};
