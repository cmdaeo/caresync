const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');

// Existing routes
/**
 * @swagger
 * /api/caregivers:
 *   get:
 *     tags: [Caregivers]
 *     summary: Get all caregivers for the current patient
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of caregivers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     caregivers:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/', caregiverController.getCaregivers);

/**
 * @swagger
 * /api/caregivers/invite:
 *   post:
 *     tags: [Caregivers]
 *     summary: Invite a caregiver by email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               relationship:
 *                 type: string
 *               permissions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/invite', caregiverController.inviteCaregiver);

/**
 * @swagger
 * /api/caregivers/{id}:
 *   delete:
 *     tags: [Caregivers]
 *     summary: Remove a caregiver
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
 *         description: Caregiver removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/:id', caregiverController.removeCaregiver);

// ADD THESE NEW ROUTES:
/**
 * @swagger
 * /api/caregivers/pending:
 *   get:
 *     tags: [Caregivers]
 *     summary: Get pending invitations for the logged-in caregiver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/pending', caregiverController.getPendingInvitations);

/**
 * @swagger
 * /api/caregivers/{id}/accept:
 *   post:
 *     tags: [Caregivers]
 *     summary: Accept a caregiver invitation
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
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.post('/:id/accept', caregiverController.acceptInvitation);

/**
 * @swagger
 * /api/caregivers/{id}/decline:
 *   post:
 *     tags: [Caregivers]
 *     summary: Decline a caregiver invitation
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
 *         description: Invitation declined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/:id/decline', caregiverController.declineInvitation);

module.exports = router;
