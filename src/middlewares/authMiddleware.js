const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user;

        // Check if it's a Customer or User (Staff)
        if (decoded.type === 'CUSTOMER') {
            user = await prisma.customer.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                    phone: true
                }
            });

            if (user) {
                user.type = 'CUSTOMER';
                user.role = 'CUSTOMER'; // Virtual role for RBAC compat
            }
        } else {
            // Internal Staff
            user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true
                }
            });

            if (user) {
                user.type = 'USER';
                // Check active status only for staff
                if (!user.isActive) {
                    return res.status(403).json({
                        success: false,
                        message: 'Account is deactivated'
                    });
                }
            }
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true
                }
            });

            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // Token invalid, but continue without user
        next();
    }
};

module.exports = { authenticate, optionalAuth };
