const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireRole } = require('../middleware/auth');

router.get('/:id', userController.getUserById);
router.patch('/:id/status', requireRole('admin'), userController.updateUserStatus);

module.exports = router;
