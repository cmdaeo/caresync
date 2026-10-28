const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: |
 *       A user may read their own profile. Admins may read any profile.
 *       A caregiver may read profiles of patients they are actively assigned to.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Caller is not allowed to read this user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res, next) => {
    // Allow: self, admins, or an assigned caregiver.
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      const { CaregiverPatient } = require('../models');
      const assignment = await CaregiverPatient.findOne({
        where: {
          caregiverId: req.user.id,
          patientId: req.params.id,
          isActive: true,
          isVerified: true,
        },
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    return userController.getUserById(req, res, next);
  })
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Update user status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/status', requireRole('admin'), userController.updateUserStatus);

module.exports = router;