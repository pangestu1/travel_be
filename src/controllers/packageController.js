const packageService = require('../services/packageService');

/**
 * Travel Package Controller
 * Handles HTTP requests for travel package management
 */

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Get all travel packages
 *     tags: [Packages]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of travel packages
 */
const getAllPackages = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, destination, search, isActive, maxPrice, startDateFrom } = req.query;

        const result = await packageService.getAllPackages(
            parseInt(page),
            parseInt(limit),
            {
                destination,
                search,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                maxPrice,
                startDateFrom
            }
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/packages/{id}:
 *   get:
 *     summary: Get travel package by ID
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Travel package details
 *       404:
 *         description: Package not found
 */
const getPackageById = async (req, res, next) => {
    try {
        const travelPackage = await packageService.getPackageById(req.params.id);

        res.json({
            success: true,
            data: travelPackage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Create a new travel package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - destination
 *               - price
 *               - quota
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               destination:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               quota:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Package created
 */
const createPackage = async (req, res, next) => {
    try {
        // Handle file upload
        if (req.file) {
            req.body.imageUrl = `/uploads/packages/${req.file.filename}`;
        }

        const travelPackage = await packageService.createPackage(req.body);

        res.status(201).json({
            success: true,
            message: 'Travel package created successfully',
            data: travelPackage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/packages/{id}:
 *   put:
 *     summary: Update travel package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TravelPackage'
 *     responses:
 *       200:
 *         description: Package updated
 */
const updatePackage = async (req, res, next) => {
    try {
        // Handle file upload
        if (req.file) {
            req.body.imageUrl = `/uploads/packages/${req.file.filename}`;
        }

        const travelPackage = await packageService.updatePackage(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Travel package updated successfully',
            data: travelPackage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/packages/{id}:
 *   delete:
 *     summary: Delete travel package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Package deleted
 *       400:
 *         description: Cannot delete package with bookings
 */
const deletePackage = async (req, res, next) => {
    try {
        await packageService.deletePackage(req.params.id);

        res.json({
            success: true,
            message: 'Travel package deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/packages/{id}/deactivate:
 *   patch:
 *     summary: Deactivate travel package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Package deactivated
 */
const deactivatePackage = async (req, res, next) => {
    try {
        const travelPackage = await packageService.deactivatePackage(req.params.id);

        res.json({
            success: true,
            message: 'Travel package deactivated successfully',
            data: travelPackage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/packages/{id}/availability:
 *   get:
 *     summary: Check package availability
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: participants
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Availability status
 */
const checkAvailability = async (req, res, next) => {
    try {
        const { participants } = req.query;
        const availability = await packageService.checkAvailability(
            req.params.id,
            parseInt(participants) || 1
        );

        res.json({
            success: true,
            data: availability
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    deactivatePackage,
    checkAvailability
};
