const interactionService = require('../services/interactionService');

/**
 * Interaction Controller
 * Handles HTTP requests for customer service interaction logs
 */

/**
 * @swagger
 * /api/interactions:
 *   get:
 *     summary: Get all interactions
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CALL, EMAIL, WHATSAPP, COMPLAINT, FOLLOW_UP, OTHER]
 *       - in: query
 *         name: isResolved
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of interactions
 */
const getAllInteractions = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, customerId, userId, type, isResolved, pendingFollowUp } = req.query;
        const result = await interactionService.getAllInteractions(
            parseInt(page),
            parseInt(limit),
            {
                customerId,
                userId,
                type,
                isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
                pendingFollowUp: pendingFollowUp === 'true'
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
 * /api/interactions/{id}:
 *   get:
 *     summary: Get interaction by ID
 *     tags: [Interactions]
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
 *         description: Interaction details
 */
const getInteractionById = async (req, res, next) => {
    try {
        const interaction = await interactionService.getInteractionById(req.params.id);

        res.json({
            success: true,
            data: interaction
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/interactions:
 *   post:
 *     summary: Create a new interaction log
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - type
 *             properties:
 *               customerId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [CALL, EMAIL, WHATSAPP, COMPLAINT, FOLLOW_UP, OTHER]
 *               notes:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Interaction created
 */
const createInteraction = async (req, res, next) => {
    try {
        // Pass the current user's ID (CS user logging the interaction)
        const interaction = await interactionService.createInteraction(req.body, req.user.id);

        res.status(201).json({
            success: true,
            message: 'Interaction logged successfully',
            data: interaction
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/interactions/{id}:
 *   put:
 *     summary: Update interaction
 *     tags: [Interactions]
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
 *         description: Interaction updated
 */
const updateInteraction = async (req, res, next) => {
    try {
        const interaction = await interactionService.updateInteraction(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Interaction updated successfully',
            data: interaction
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/interactions/{id}/resolve:
 *   patch:
 *     summary: Mark interaction as resolved
 *     tags: [Interactions]
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
 *         description: Interaction resolved
 */
const resolveInteraction = async (req, res, next) => {
    try {
        const interaction = await interactionService.resolveInteraction(req.params.id);

        res.json({
            success: true,
            message: 'Interaction marked as resolved',
            data: interaction
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/interactions/follow-ups:
 *   get:
 *     summary: Get pending follow-ups for current user
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending follow-ups
 */
const getPendingFollowUps = async (req, res, next) => {
    try {
        const followUps = await interactionService.getPendingFollowUps(req.user.id);

        res.json({
            success: true,
            data: followUps
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/interactions/customer/{customerId}:
 *   get:
 *     summary: Get all interactions for a customer
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer interactions
 */
const getCustomerInteractions = async (req, res, next) => {
    try {
        const interactions = await interactionService.getCustomerInteractions(
            parseInt(req.params.customerId)
        );

        res.json({
            success: true,
            data: interactions
        });
    } catch (error) {
        next(error);
    }
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
