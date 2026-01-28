const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/rbacMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateMiddleware');
const { createUserSchema, updateUserSchema, idParamSchema } = require('../validators/userValidator');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only)
 */

// All routes require authentication and admin role
router.use(authenticate, adminOnly);

router.get('/', userController.getAllUsers);
router.get('/:id', validateParams(idParamSchema), userController.getUserById);
router.post('/', validateBody(createUserSchema), userController.createUser);
router.put('/:id', validateParams(idParamSchema), validateBody(updateUserSchema), userController.updateUser);
router.delete('/:id', validateParams(idParamSchema), userController.deleteUser);
router.patch('/:id/deactivate', validateParams(idParamSchema), userController.deactivateUser);

module.exports = router;
