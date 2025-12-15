const { Adherence, Medication, CaregiverPatient } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class CalendarController {
  /**
   * Helper to validate if the requesting user has access to the target patient's data.
   */
  async _validateAccess(requestingUser, targetUserId) {
    // 1. Check if user is requesting their own data
    if (requestingUser.id === targetUserId) return true;

    // 2. Check role-based broad access
    if (['admin', 'healthcareprovider'].includes(requestingUser.role)) return true;

    // 3. Check Caregiver relationship
    if (requestingUser.role === 'caregiver') {
      const relation = await CaregiverPatient.findOne({
        where: {
          caregiverId: requestingUser.id,
          patientId: targetUserId,
          isActive: true,
          isVerified: true
        }
      });
      return !!relation;
    }

    return false;
  }

  /**
   * Determine medication status based on scheduled time and taken time
   */
  _determineMedicationStatus(scheduledTime, takenAt, status) {
    if (status === 'skipped') return 'skipped';
    if (!takenAt) return 'missed';

    const scheduled = new Date(scheduledTime);
    const taken = new Date(takenAt);
    const diffMinutes = (taken - scheduled) / (1000 * 60);

    // More than 1 hour late
    if (diffMinutes > 60) return 'late';
    // More than 30 minutes early
    if (diffMinutes < -30) return 'early';
    
    return 'taken';
  }

  /**
   * Get calendar view data for medication adherence
   * Route: GET /api/calendar
   */
  async getCalendarData(req, res) {
    try {
      const { startDate, endDate, patientId } = req.query;

      // Determine target user
      const targetUserId = patientId || req.user.id;

      // Validate Access
      const hasAccess = await this._validateAccess(req.user, targetUserId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access denied to patient data.' });
      }

      // Set default date range (last 30 days)
      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const defaultEndDate = now;

      const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
      const queryEndDate = endDate ? new Date(endDate) : defaultEndDate;

      // Fetch adherence records with medication details
      const adherenceRecords = await Adherence.findAll({
        where: {
          userId: targetUserId,
          scheduledTime: {
            [Op.between]: [queryStartDate, queryEndDate]
          }
        },
        include: [{
          model: Medication,
          attributes: ['id', 'name', 'dosage', 'dosageUnit', 'compartment']
        }],
        order: [['scheduledTime', 'ASC']]
      });

      // Group by date and format data
      const calendarData = {};

      adherenceRecords.forEach(record => {
        const date = new Date(record.scheduledTime).toISOString().split('T')[0];
        
        if (!calendarData[date]) {
          calendarData[date] = [];
        }

        calendarData[date].push({
          id: record.id,
          medicationId: record.medicationId,
          name: record.Medication?.name || 'Unknown Medication',
          dosage: record.Medication?.dosage + ' ' + record.Medication?.dosageUnit || '',
          compartment: record.Medication?.compartment || null,
          scheduledTime: record.scheduledTime,
          takenAt: record.takenAt,
          status: this._determineMedicationStatus(
            record.scheduledTime,
            record.takenAt,
            record.status
          )
        });
      });

      // Convert to array and sort by date
      const result = Object.keys(calendarData).map(date => ({
        date,
        medications: calendarData[date]
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json({
        success: true,
        data: {
          calendar: result,
          dateRange: {
            startDate: queryStartDate,
            endDate: queryEndDate
          }
        }
      });

    } catch (error) {
      logger.error('Get calendar data error', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get calendar data for a specific medication
   * Route: GET /api/calendar/medication/:medicationId
   */
  async getMedicationCalendarData(req, res) {
    try {
      const { medicationId } = req.params;
      const { startDate, endDate, patientId } = req.query;

      const targetUserId = patientId || req.user.id;

      // Validate Access
      const hasAccess = await this._validateAccess(req.user, targetUserId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      // Set default date range (last 30 days)
      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const defaultEndDate = now;

      const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
      const queryEndDate = endDate ? new Date(endDate) : defaultEndDate;

      // Fetch adherence records for specific medication
      const adherenceRecords = await Adherence.findAll({
        where: {
          userId: targetUserId,
          medicationId,
          scheduledTime: {
            [Op.between]: [queryStartDate, queryEndDate]
          }
        },
        include: [{
          model: Medication,
          attributes: ['id', 'name', 'dosage', 'dosageUnit', 'compartment']
        }],
        order: [['scheduledTime', 'ASC']]
      });

      // Group by date
      const calendarData = {};

      adherenceRecords.forEach(record => {
        const date = new Date(record.scheduledTime).toISOString().split('T')[0];
        
        if (!calendarData[date]) {
          calendarData[date] = [];
        }

        calendarData[date].push({
          id: record.id,
          medicationId: record.medicationId,
          name: record.Medication?.name || 'Unknown Medication',
          dosage: record.Medication?.dosage + ' ' + record.Medication?.dosageUnit || '',
          compartment: record.Medication?.compartment || null,
          scheduledTime: record.scheduledTime,
          takenAt: record.takenAt,
          status: this._determineMedicationStatus(
            record.scheduledTime,
            record.takenAt,
            record.status
          )
        });
      });

      const result = Object.keys(calendarData).map(date => ({
        date,
        medications: calendarData[date]
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json({
        success: true,
        data: {
          calendar: result,
          medicationId,
          medicationName: adherenceRecords[0]?.Medication?.name || 'Unknown',
          dateRange: {
            startDate: queryStartDate,
            endDate: queryEndDate
          }
        }
      });

    } catch (error) {
      logger.error('Get medication calendar data error', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CalendarController();