const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public authentication routes
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);

// Protected session & identity routes
router.get('/me', requireAuth, authController.getMe);

// Admin-only user management
router.get('/users', requireAuth, requireRole('ADMIN'), authController.listUsers);

module.exports = router;
