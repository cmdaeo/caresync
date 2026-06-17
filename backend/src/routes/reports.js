const express = require('express');
const router = express.Router();
const { Adherence, Medication, User, DocumentMetadata } = require('../models');
const {authMiddleware} = require('../middleware/auth');
const {asyncHandler} = require('../middleware/errorHandler');
const { query, validationResult } = require('express-validator');
const EnhancedPdfService = require('../services/enhancedPdfService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
  
/**
 * @swagger
 * /api/reports/report/pdf:
 *   get:
 *     tags: [Reports]
 *     summary: Generate a PDF adherence report for a given date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: includeCharts
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: passwordProtect
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: signatureRequired
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Internal server error
 */
router.get(
  '/report/pdf',
  authMiddleware,
  [
    query('startDate', 'Invalid start date format').isISO8601(),
    query('endDate', 'Invalid end date format').isISO8601(),
    query('includeCharts').optional().isBoolean().toBoolean(),
    query('passwordProtect').optional().isBoolean().toBoolean(),
    query('reportPassword').optional().isString(),
    query('signatureRequired').optional().isBoolean().toBoolean()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { startDate, endDate, includeCharts, passwordProtect, reportPassword, signatureRequired, patientId } = req.query;
      let targetUserId = req.user.id;

      // If caregiver requests patient report, verify permissions
      if (patientId) {
        const { CaregiverPatient } = require('../models');
        const rel = await CaregiverPatient.findOne({
          where: {
            caregiverId: req.user.id,
            patientId: patientId,
            isActive: true,
            isVerified: true
          }
        });

        if (!rel || !rel.permissions?.canViewAdherence) {
          return res.status(403).json({ success: false, message: 'Not authorized to view adherence reports for this patient' });
        }
        targetUserId = patientId;
      }

      // 1. Fetch User Data (with additional fields for enhanced report)
      const user = await User.findByPk(targetUserId, {
        attributes: ['id', 'firstName', 'lastName', 'email']
      });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // 2. Fetch Adherence Records
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Ensure the whole end day is included

      const records = await Adherence.findAll({
        where: {
          userId: targetUserId,
          scheduledTime: {
            [Op.between]: [start, end]
          }
        },
        include: [{
          model: Medication,
          attributes: ['id', 'name', 'dosage', 'dosageUnit']
        }],
        order: [['scheduledTime', 'ASC']]
      });

      // 3. Calculate Enhanced Statistics
      const total = records.length;
      const missed = records.filter(r => r.status === 'missed').length;
      const taken = total - missed;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

      const adherenceData = {
        rate: `${rate}%`,
        total,
        missed,
        startDate,
        endDate,
        history: records
      };

      // 4. Generate Enhanced PDF using the new service
      const pdfBuffer = await EnhancedPdfService.generateEnhancedReport(
        user.toJSON ? user.toJSON() : user,
        adherenceData,
        startDate,
        endDate,
        {
          includeCharts,
          passwordProtect,
          reportPassword,
          signatureRequired,
          origin: req.headers.origin
        }
      );
      
      // 5. Send PDF as response
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-Disposition': `attachment; filename="CareSync_Adherence_Report_${startDate}_to_${endDate}.pdf"`
      });

      res.send(pdfBuffer);
      logger.info(`Successfully generated enhanced PDF report for user ${targetUserId}`);

    } catch (error) {
      logger.error('Failed to generate enhanced PDF report', error);
      res.status(500).json({ success: false, message: 'An error occurred while generating the report.' });
    }
  })
);

/**
 * @swagger
 * /api/reports/verify:
 *   get:
 *     tags: [Reports]
 *     summary: Verify document authenticity
 *     parameters:
 *       - in: query
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 document:
 *                   type: object
 *                   properties:
 *                     documentId: {type: string}
 *                     documentType: {type: string}
 *                     generationTimestamp: {type: string}
 *                     expirationDate: {type: string}
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Internal server error
 */
router.get(
  '/verify',
  [
    query('docId', 'Invalid document ID').isUUID()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { docId } = req.query;

      // Public verification - no auth check, but only returns non-PII metadata
      const document = await DocumentMetadata.findOne({
        where: { documentId: docId }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          valid: false,
          message: 'Document not found'
        });
      }

      // Check if document is expired
      if (document.expirationDate && new Date() > document.expirationDate) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Document has expired'
        });
      }

      document.accessCount += 1;
      document.lastAccessed = new Date();
      await document.save();

      res.json({
        success: true,
        valid: true,
        message: 'Document is valid and authentic',
        document: {
          documentId: document.documentId,
          documentType: document.documentType,
          documentHash: document.documentHash,
          generationTimestamp: document.generationTimestamp,
          expirationDate: document.expirationDate,
          passwordProtected: document.passwordProtected,
          signatureRequired: document.signatureRequired
        }
      });

    } catch (error) {
      logger.error('Document verification failed', error);
      res.status(500).json({ success: false, message: 'Document verification failed' });
    }
  })
);

module.exports = router;
