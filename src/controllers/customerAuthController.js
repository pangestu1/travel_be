const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Customer Authentication Controller
 * Handles registration and login for Customers
 */

/**
 * @swagger
 * /api/auth/customer/register:
 *   post:
 *     summary: Register as a new customer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registered successfully
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check existing email
        const existing = await prisma.customer.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                address,
                status: 'PROSPECT' // Default status
            }
        });

        // Generate token
        const token = jwt.sign(
            { userId: customer.id, type: 'CUSTOMER' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                type: 'CUSTOMER'
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/auth/customer/login:
 *   post:
 *     summary: Customer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const customer = await prisma.customer.findUnique({ where: { email } });
        if (!customer) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Use userId to match authMiddleware expectation
        const token = jwt.sign(
            { userId: customer.id, type: 'CUSTOMER' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                type: 'CUSTOMER'
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login
};
