const { Medication, Adherence, CaregiverPatient } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { AppError, AuthorizationError } = require('../middleware/errorHandler');

class MedicationService {

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Helper to validate if the requesting user has access to the target patient's data.
   */
  async _validateAccess(requestingUser, targetUserId) {
    if (requestingUser.id === targetUserId) return true;
    if (['admin', 'healthcareprovider'].includes(requestingUser.role)) return true;

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

    // Window logic: +/- 15 mins is "On Time" (taken)
    if (diffMinutes > 15) return 'late';
    if (diffMinutes < -15) return 'early';
    
    return 'taken';
  }

  // ==========================================
  // CORE MEDICATION CRUD
  // ==========================================

  /**
   * Get all medications with pagination and optional filtering
   */
  async getMedications(user, query) {
    const { page = 1, limit = 20, status = 'active', search, patientId } = query;
    
    const targetUserId = patientId || user.id;
    if (!(await this._validateAccess(user, targetUserId))) {
      throw new AuthorizationError('Access denied to patient data');
    }

    const offset = (page - 1) * limit;
    const whereClause = { userId: targetUserId };

    if (status !== 'all') whereClause.isActive = status === 'active';
    if (search) whereClause.name = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Medication.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return {
      medications: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  async getMedication(user, id, patientId) {
    const targetUserId = patientId || user.id;

    if (!(await this._validateAccess(user, targetUserId))) {
      throw new AuthorizationError('Access denied');
    }

    const medication = await Medication.findOne({
      where: { id, userId: targetUserId }
    });

    if (!medication) throw new AppError('Medication not found', 404);

    return medication;
  }

  async createMedication(user, medData) {
    const medicationData = {
      ...medData,
      userId: user.id,
      remainingQuantity: medData.remainingQuantity !== undefined 
        ? medData.remainingQuantity 
        : medData.totalQuantity
    };

    const medication = await Medication.create(medicationData);
    return medication;
  }

  async updateMedication(user, id, medData) {
    const medication = await Medication.findOne({ 
      where: { id, userId: user.id } 
    });

    if (!medication) throw new AppError('Medication not found', 404);

    await medication.update(medData);
    return medication;
  }

  async deleteMedication(user, id) {
    const medication = await Medication.findOne({ 
      where: { id, userId: user.id } 
    });

    if (!medication) throw new AppError('Medication not found', 404);

    // Soft delete: set inactive
    await medication.update({ isActive: false });
    return { success: true, message: 'Medication deactivated' };
  }

  // ==========================================
  // ADHERENCE LOGIC
  // ==========================================

  async getAdherenceRecords(user, query) {
    const { page = 1, limit = 20, startDate, endDate, medicationId, patientId } = query;
    const targetUserId = patientId || user.id;

    if (!(await this._validateAccess(user, targetUserId))) {
      throw new AuthorizationError('Access denied to patient data.');
    }

    const offset = (page - 1) * limit;
    const whereClause = { userId: targetUserId };

    if (startDate && endDate) {
      whereClause.takenAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    if (medicationId) whereClause.medicationId = medicationId;

    const { count, rows } = await Adherence.findAndCountAll({
      where: whereClause,
      include: [{
        model: Medication,
        attributes: ['id', 'name', 'dosage', 'dosageUnit']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['takenAt', 'DESC']]
    });

    return {
      adherenceRecords: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  async recordAdherence(user, adherenceData) {
    const { medicationId, status, takenAt, scheduledTime } = adherenceData;
    
    const intake = await Adherence.create({
      userId: user.id,
      medicationId,
      status: status || 'taken',
      takenAt: takenAt || new Date(),
      scheduledTime: scheduledTime || new Date()
    });

    // Update medication stock
    if (status === 'taken') {
      const med = await Medication.findByPk(medicationId);
      if (med) {
        await med.decrement('remainingQuantity', { by: 1 });
      }
    }

    return intake;
  }

  async getAdherenceStats(user, query) {
    const { startDate, endDate, period = 'month', patientId } = query;
    const targetUserId = patientId || user.id;

    if (!(await this._validateAccess(user, targetUserId))) {
      throw new AuthorizationError('Access denied to patient data.');
    }

    const whereClause = { userId: targetUserId };

    if (startDate && endDate) {
      whereClause.takenAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      whereClause.takenAt = { [Op.between]: [thirtyDaysAgo, now] };
    }

    const adherenceRecords = await Adherence.findAll({
      where: whereClause,
      include: [{ model: Medication, attributes: ['name'] }]
    });

    const total = adherenceRecords.length;
    const taken = adherenceRecords.filter(r => r.status === 'taken').length;
    const missed = adherenceRecords.filter(r => r.status === 'missed').length;
    const skipped = adherenceRecords.filter(r => r.status === 'skipped').length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

    return { rate, total, taken, missed, skipped, period };
  }

  // ==========================================
  // CALENDAR / SCHEDULE LOGIC
  // ==========================================

  async getCalendarData(user, query) {
    const { startDate, endDate, patientId } = query;
    const targetUserId = patientId || user.id;

    if (!(await this._validateAccess(user, targetUserId))) {
      throw new AuthorizationError('Access denied to patient data.');
    }

    const now = new Date();
    const queryStartDate = startDate ? new Date(startDate) : new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const queryEndDate = endDate ? new Date(endDate) : now;

    // Fetch actual records
    const adherenceRecords = await Adherence.findAll({
      where: {
        userId: targetUserId,
        scheduledTime: { [Op.between]: [queryStartDate, queryEndDate] }
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
      if (!calendarData[date]) calendarData[date] = [];

      calendarData[date].push({
        id: record.id,
        medicationId: record.medicationId,
        name: record.Medication?.name || 'Unknown Medication',
        dosage: record.Medication?.dosage + ' ' + record.Medication?.dosageUnit || '',
        compartment: record.Medication?.compartment || null,
        scheduledTime: record.scheduledTime,
        takenAt: record.takenAt,
        status: this._determineMedicationStatus(record.scheduledTime, record.takenAt, record.status)
      });
    });

    const result = Object.keys(calendarData).map(date => ({
      date,
      medications: calendarData[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      calendar: result,
      dateRange: { startDate: queryStartDate, endDate: queryEndDate }
    };
  }
}

module.exports = new MedicationService();