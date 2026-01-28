const express = require('express');
const router = express.Router();

const interactionController = require('../controllers/interactionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { csAndAdmin, staffOnly } = require('../middlewares/rbacMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateMiddleware');
const { createInteractionSchema, updateInteractionSchema, idParamSchema } = require('../validators/interactionValidator');

/**
 * @swagger
 * tags:
 *   name: Interactions
 *   description: Customer service interaction logs
 */

// All routes require authentication
router.use(authenticate);

// Get pending follow-ups for current user
router.get('/follow-ups', csAndAdmin, interactionController.getPendingFollowUps);

// Get all interactions
router.get('/', staffOnly, interactionController.getAllInteractions);

// Get interactions by customer
router.get('/customer/:customerId', staffOnly, interactionController.getCustomerInteractions);

// Get single interaction
router.get('/:id', staffOnly, validateParams(idParamSchema), interactionController.getInteractionById);

// Create interaction - CS and Admin
router.post('/', csAndAdmin, validateBody(createInteractionSchema), interactionController.createInteraction);

// Update interaction
router.put('/:id', csAndAdmin, validateParams(idParamSchema), validateBody(updateInteractionSchema), interactionController.updateInteraction);

// Resolve interaction
router.patch('/:id/resolve', csAndAdmin, validateParams(idParamSchema), interactionController.resolveInteraction);

module.exports = router;
