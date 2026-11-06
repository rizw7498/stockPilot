const express = require('express');
const { z } = require('zod');
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();

const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    organizationName: z.string().min(2, 'Organization name is required'),
    currency: z.string().length(3).optional().default('USD'),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
};

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
