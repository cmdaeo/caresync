const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');

// Existing routes
/**
 * @swagger
 * /api/patients:
 *   get:
 *     tags: [Patients]
 *     summary: Get all patients for the logged-in caregiver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', caregiverController.getPatients);

/**
 * @swagger
 * /api/patients/pending:
 *   get:
 *     tags: [Patients]
 *     summary: Get pending invitations sent to the patient
 *     security:
 *       - bearerAuth: []
 */
router.get('/pending', caregiverController.getPatientPendingInvitations);

/**
 * @swagger
 * /api/patients/invite:
 *   post:
 *     tags: [Patients]
 *     summary: Invite a patient
 *     security:
 *       - bearerAuth: []
 */
router.post('/invite', caregiverController.invitePatient);

/**
 * @swagger
 * /api/patients/{id}/accept:
 *   post:
 *     tags: [Patients]
 *     summary: Accept a patient invitation
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/accept', caregiverController.acceptPatientInvitation);

/**
 * @swagger
 * /api/patients/{id}/decline:
 *   post:
 *     tags: [Patients]
 *     summary: Decline a patient invitation
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/decline', caregiverController.declinePatientInvitation);

/**
 * @swagger
 * /api/patients/{id}/revoke:
 *   delete:
 *     tags: [Patients]
 *     summary: Revoke access to a patient
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/revoke', caregiverController.removeCaregiver);

/**
 * @swagger
 * /api/patients/{id}/permissions:
 *   put:
 *     tags: [Patients]
 *     summary: Update caregiver permissions
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/permissions', caregiverController.updatePermissions);

module.exports = router;
