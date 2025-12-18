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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', caregiverController.getPatients);

module.exports = router;
