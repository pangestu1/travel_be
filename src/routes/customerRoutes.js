const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const { authenticate } = require('../middlewares/authMiddleware');
const { staffOnly, salesAndAdmin } = require('../middlewares/rbacMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateMiddleware');
const { createCustomerSchema, updateCustomerSchema, idParamSchema } = require('../validators/customerValidator');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all staff
router.get('/', staffOnly, customerController.getAllCustomers);
router.get('/:id', staffOnly, validateParams(idParamSchema), customerController.getCustomerById);

// CUD routes - Sales and Admin only
router.post('/', salesAndAdmin, validateBody(createCustomerSchema), customerController.createCustomer);
router.put('/:id', salesAndAdmin, validateParams(idParamSchema), validateBody(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id', salesAndAdmin, validateParams(idParamSchema), customerController.deleteCustomer);

module.exports = router;
