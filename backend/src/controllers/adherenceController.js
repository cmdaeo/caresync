const { Adherence, Medication } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class AdherenceController {
  /**
   * Get adherence records
   * Route: GET /
   */
  async getAdherenceRecords(req, res) {
    try {
      const { page = 1, limit = 20, startDate, endDate, medicationId } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { userId: req.user.id };

      if (startDate && endDate) {
        whereClause.takenAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      if (medicationId) {
        whereClause.medicationId = medicationId;
      }

      const { count, rows: records } = await Adherence.findAndCountAll({
        where: whereClause,
        include: [{
          model: Medication,
          attributes: ['id', 'name', 'dosage', 'dosageUnit']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['takenAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          records,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get adherence records error:', error);
      throw error;
    }
  }

  /**
   * Get single adherence record by ID
   * Route: GET /:id
   */
  async getAdherenceRecord(req, res) {
    try {
      const { id } = req.params;
      
      const record = await Adherence.findOne({
        where: { id, userId: req.user.id },
        include: [{
          model: Medication,
          attributes: ['id', 'name', 'dosage', 'dosageUnit']
        }]
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Adherence record not found'
        });
      }

      res.json({ success: true, data: { record } });
    } catch (error) {
      logger.error('Get adherence record error:', error);
      throw error;
    }
  }

  /**
   * Record adherence
   * Route: POST /
   */
  async recordAdherence(req, res) {
    try {
      const { medicationId, status, takenAt, scheduledTime } = req.body;

      const intake = await Adherence.create({
        userId: req.user.id,
        medicationId,
        status: status || 'taken',
        takenAt: takenAt || new Date(),
        scheduledTime: scheduledTime || new Date()
      });
      
      if (status === 'taken') {
        const med = await Medication.findByPk(medicationId);
        if (med) await med.decrement('remainingQuantity', { by: 1 });
      }

      res.status(201).json({ 
        success: true, 
        message: 'Adherence recorded successfully',
        data: { adherence: intake } 
      });
    } catch (error) {
      logger.error('Record adherence error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update adherence record
   * Route: PUT /:id
   */
  async updateAdherenceRecord(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const record = await Adherence.findOne({
        where: { id, userId: req.user.id }
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Adherence record not found'
        });
      }

      await record.update(updates);

      res.json({
        success: true,
        message: 'Adherence record updated',
        data: { record }
      });
    } catch (error) {
      logger.error('Update adherence record error:', error);
      throw error;
    }
  }

  /**
   * Get adherence statistics
   * Route: GET /stats
   */
  async getAdherenceStats(req, res) {
    try {
      const { startDate, endDate, period = 'month' } = req.query;
      
      const whereClause = { userId: req.user.id };
      
      if (startDate && endDate) {
        whereClause.takenAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else {
        // Default to last 30 days if no dates provided
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        whereClause.takenAt = {
          [Op.between]: [thirtyDaysAgo, now]
        };
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

      res.json({
        success: true,
        data: {
          rate,
          total,
          taken,
          missed,
          skipped,
          period
        }
      });
    } catch (error) {
      logger.error('Get adherence stats error:', error);
      throw error;
    }
  }

  /**
   * Get adherence trends over time
   * Route: GET /trends
   */
  async getAdherenceTrends(req, res) {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const records = await Adherence.findAll({
        where: {
          userId: req.user.id,
          takenAt: { [Op.gte]: startDate }
        },
        attributes: ['takenAt', 'status'],
        order: [['takenAt', 'ASC']]
      });

      // Group by date
      const trends = records.reduce((acc, record) => {
        const date = new Date(record.takenAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, taken: 0, missed: 0, total: 0 };
        }
        acc[date].total++;
        if (record.status === 'taken') acc[date].taken++;
        if (record.status === 'missed') acc[date].missed++;
        return acc;
      }, {});

      const trendsArray = Object.values(trends).map((day) => ({
        ...day,
        rate: day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0
      }));

      res.json({
        success: true,
        data: { trends: trendsArray }
      });
    } catch (error) {
      logger.error('Get trends error:', error);
      throw error;
    }
  }

  /**
   * Get adherence by medication
   * Route: GET /medication/:medicationId
   */
  async getMedicationAdherence(req, res) {
    try {
      const { medicationId } = req.params;
      const { startDate, endDate } = req.query;

      const whereClause = {
        userId: req.user.id,
        medicationId
      };

      if (startDate && endDate) {
        whereClause.takenAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const records = await Adherence.findAll({
        where: whereClause,
        include: [{
          model: Medication,
          attributes: ['id', 'name', 'dosage', 'dosageUnit']
        }],
        order: [['takenAt', 'DESC']]
      });

      const total = records.length;
      const taken = records.filter(r => r.status === 'taken').length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

      res.json({
        success: true,
        data: {
          medicationId,
          records,
          stats: { total, taken, rate }
        }
      });
    } catch (error) {
      logger.error('Get medication adherence error:', error);
      throw error;
    }
  }

  /**
   * Bulk record adherence records
   * Route: POST /bulk
   */
  async bulkRecordAdherence(req, res) {
    try {
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Records array is required'
        });
      }

      const adherenceRecords = records.map(record => ({
        ...record,
        userId: req.user.id,
        takenAt: record.takenAt || new Date()
      }));

      const created = await Adherence.bulkCreate(adherenceRecords);

      res.status(201).json({
        success: true,
        message: `${created.length} records created`,
        data: { records: created }
      });
    } catch (error) {
      logger.error('Bulk record adherence error:', error);
      throw error;
    }
  }
}

module.exports = new AdherenceController();
