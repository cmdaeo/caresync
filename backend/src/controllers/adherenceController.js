const { Adherence, Medication, Device } = require('../models');
const logger = require('../utils/logger');

class AdherenceController {
  /**
   * Get adherence records with pagination and filtering
   */
  async getAdherenceRecords(req, res) {
    try {
      const { page = 1, limit = 20, status, medicationId, dateFrom, dateTo } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = { userId: req.user.id };
      if (status) whereClause.status = status;
      if (medicationId) whereClause.medicationId = medicationId;
      if (dateFrom || dateTo) {
        whereClause.scheduledTime = {};
        if (dateFrom) whereClause.scheduledTime[require('sequelize').Op.gte] = new Date(dateFrom);
        if (dateTo) whereClause.scheduledTime[require('sequelize').Op.lte] = new Date(dateTo);
      }

      const { count, rows: adherenceRecords } = await Adherence.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['scheduledTime', 'DESC']],
        include: [{
          model: Medication,
          as: 'medication',
          attributes: ['id', 'name', 'dosage', 'dosageUnit']
        }]
      });

      res.json({
        success: true,
        data: {
          adherenceRecords,
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
   * Get single adherence record
   */
  async getAdherenceRecord(req, res) {
    try {
      const { id } = req.params;

      const adherenceRecord = await Adherence.findOne({
        where: {
          id,
          userId: req.user.id
        },
        include: [
          {
            model: Medication,
            as: 'medication',
            attributes: ['id', 'name', 'dosage', 'dosageUnit']
          },
          {
            model: Device,
            as: 'device',
            attributes: ['id', 'name', 'deviceType']
          }
        ]
      });

      if (!adherenceRecord) {
        return res.status(404).json({
          success: false,
          message: 'Adherence record not found'
        });
      }

      res.json({
        success: true,
        data: {
          adherenceRecord
        }
      });
    } catch (error) {
      logger.error('Get adherence record error:', error);
      throw error;
    }
  }

  /**
   * Record medication adherence
   */
  async recordAdherence(req, res) {
    try {
      const {
        medicationId,
        scheduledTime,
        takenTime,
        status,
        dosageTaken,
        confirmationMethod,
        deviceId,
        notes,
        sideEffects,
        location,
        vitalSigns,
        isEmergency
      } = req.body;

      // Verify medication belongs to user
      const medication = await Medication.findOne({
        where: {
          id: medicationId,
          userId: req.user.id
        }
      });

      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }

      // Verify device belongs to user if provided
      if (deviceId) {
        const device = await Device.findOne({
          where: {
            id: deviceId,
            userId: req.user.id
          }
        });

        if (!device) {
          return res.status(404).json({
            success: false,
            message: 'Device not found'
          });
        }
      }

      const adherenceData = {
        userId: req.user.id,
        medicationId,
        scheduledTime: new Date(scheduledTime),
        takenTime: takenTime ? new Date(takenTime) : null,
        status,
        dosageTaken,
        confirmationMethod,
        deviceId,
        notes,
        sideEffects,
        location,
        vitalSigns,
        isEmergency,
        dataSource: 'mobile_app'
      };

      const adherenceRecord = await Adherence.create(adherenceData);

      // If medication was taken, update remaining quantity if needed
      if (status === 'taken' && !isEmergency) {
        const daysSupply = medication.frequency.timesPerDay || 1;
        const newRemainingQuantity = Math.max(0, medication.remainingQuantity - 1);
        
        if (newRemainingQuantity !== medication.remainingQuantity) {
          await medication.update({ remainingQuantity: newRemainingQuantity });
        }
      }

      logger.info(`Adherence recorded: ${status} for medication ${medication.name} by user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Adherence recorded successfully',
        data: {
          adherenceRecord
        }
      });
    } catch (error) {
      logger.error('Record adherence error:', error);
      throw error;
    }
  }

  /**
   * Update adherence record
   */
  async updateAdherenceRecord(req, res) {
    try {
      const { id } = req.params;

      const adherenceRecord = await Adherence.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!adherenceRecord) {
        return res.status(404).json({
          success: false,
          message: 'Adherence record not found'
        });
      }

      // Update the record
      await adherenceRecord.update(req.body);

      logger.info(`Adherence record updated: ${adherenceRecord.id} by user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Adherence record updated successfully',
        data: {
          adherenceRecord
        }
      });
    } catch (error) {
      logger.error('Update adherence record error:', error);
      throw error;
    }
  }

  /**
   * Get adherence statistics
   */
  async getAdherenceStats(req, res) {
    try {
      const { period = 'month', medicationId } = req.query;

      // Calculate date range based on period
      const now = new Date();
      let startDate;
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
          break;
        case 'year':
          startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
          break;
        default:
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      }

      // Build where clause
      const whereClause = {
        userId: req.user.id,
        scheduledTime: {
          [require('sequelize').Op.gte]: startDate
        }
      };

      if (medicationId) {
        whereClause.medicationId = medicationId;
      }

      // Get adherence statistics
      const stats = await Promise.all([
        // Total scheduled doses
        Adherence.count({ where: whereClause }),
        
        // Doses taken on time
        Adherence.count({
          where: {
            ...whereClause,
            status: 'taken'
          }
        }),
        
        // Missed doses
        Adherence.count({
          where: {
            ...whereClause,
            status: 'missed'
          }
        }),
        
        // Delayed doses
        Adherence.count({
          where: {
            ...whereClause,
            status: 'delayed'
          }
        }),
        
        // Skipped doses
        Adherence.count({
          where: {
            ...whereClause,
            status: 'skipped'
          }
        })
      ]);

      const [totalScheduled, taken, missed, delayed, skipped] = stats;
      const totalCompleted = taken + missed + delayed + skipped;
      const adherenceRate = totalScheduled > 0 ? (taken / totalScheduled * 100) : 0;

      // Get daily adherence breakdown for charts
      const dailyAdherence = await Adherence.findAll({
        where: whereClause,
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('scheduledTime')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
          [require('sequelize').fn('SUM', require('sequelize').case([{ when: { status: 'taken' }, then: 1 }], { else: 0 })), 'taken']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('scheduledTime'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('scheduledTime')), 'ASC']]
      });

      res.json({
        success: true,
        data: {
          period,
          statistics: {
            totalScheduled,
            taken,
            missed,
            delayed,
            skipped,
            totalCompleted,
            adherenceRate: Math.round(adherenceRate * 100) / 100
          },
          dailyAdherence
        }
      });
    } catch (error) {
      logger.error('Get adherence stats error:', error);
      throw error;
    }
  }

  /**
   * Bulk record adherence from device sync
   */
  async bulkRecordAdherence(req, res) {
    try {
      const { adherenceRecords, deviceId } = req.body;

      // Verify device belongs to user if provided
      if (deviceId) {
        const device = await Device.findOne({
          where: {
            id: deviceId,
            userId: req.user.id
          }
        });

        if (!device) {
          return res.status(404).json({
            success: false,
            message: 'Device not found'
          });
        }
      }

      const results = [];
      const errors_list = [];

      // Process each adherence record
      for (const record of adherenceRecords) {
        try {
          // Verify medication belongs to user
          const medication = await Medication.findOne({
            where: {
              id: record.medicationId,
              userId: req.user.id
            }
          });

          if (!medication) {
            errors_list.push({
              medicationId: record.medicationId,
              error: 'Medication not found'
            });
            continue;
          }

          const adherenceData = {
            ...record,
            userId: req.user.id,
            scheduledTime: new Date(record.scheduledTime),
            takenTime: record.takenTime ? new Date(record.takenTime) : null,
            deviceId,
            dataSource: deviceId ? 'carebox' : 'mobile_app'
          };

          const adherenceRecord = await Adherence.create(adherenceData);
          results.push(adherenceRecord);

        } catch (error) {
          errors_list.push({
            record: record,
            error: error.message
          });
        }
      }

      logger.info(`Bulk adherence sync: ${results.length} records processed for user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Bulk adherence records processed',
        data: {
          processed: results.length,
          errors: errors_list.length,
          results,
          errors_list
        }
      });
    } catch (error) {
      logger.error('Bulk record adherence error:', error);
      throw error;
    }
  }

  /**
   * Get adherence trends over time
   */
  async getAdherenceTrends(req, res) {
    try {
      const { months = 6, medicationId } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date(now.getTime() - (months * 30 * 24 * 60 * 60 * 1000));

      // Build where clause
      const whereClause = {
        userId: req.user.id,
        scheduledTime: {
          [require('sequelize').Op.gte]: startDate,
          [require('sequelize').Op.lte]: now
        }
      };

      if (medicationId) {
        whereClause.medicationId = medicationId;
      }

      // Get monthly adherence trends
      const monthlyTrends = await Adherence.findAll({
        where: whereClause,
        attributes: [
          [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('scheduledTime'), '%Y-%m'), 'month'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
          [require('sequelize').fn('SUM', require('sequelize').case([{ when: { status: 'taken' }, then: 1 }], { else: 0 })), 'taken']
        ],
        group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('scheduledTime'), '%Y-%m')],
        order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('scheduledTime'), '%Y-%m'), 'ASC']]
      });

      // Calculate compliance rates
      const trends = monthlyTrends.map(trend => {
        const total = parseInt(trend.getDataValue('total'));
        const taken = parseInt(trend.getDataValue('taken'));
        const complianceRate = total > 0 ? (taken / total * 100) : 0;
        
        return {
          month: trend.getDataValue('month'),
          total,
          taken,
          complianceRate: Math.round(complianceRate * 100) / 100
        };
      });

      res.json({
        success: true,
        data: {
          trends,
          period: `${months} months`
        }
      });
    } catch (error) {
      logger.error('Get adherence trends error:', error);
      throw error;
    }
  }

  /**
   * Get medication-specific adherence for a medication
   */
  async getMedicationAdherence(req, res) {
    try {
      const { medicationId } = req.params;
      const { period = 'month' } = req.query;

      // Verify medication belongs to user
      const medication = await Medication.findOne({
        where: {
          id: medicationId,
          userId: req.user.id
        }
      });

      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }

      // Get adherence statistics for this specific medication
      const stats = await this.getAdherenceStats({
        query: { period, medicationId },
        user: req.user
      });

      res.json({
        success: true,
        data: {
          medication: {
            id: medication.id,
            name: medication.name,
            dosage: medication.dosage,
            dosageUnit: medication.dosageUnit
          },
          statistics: stats.statistics,
          dailyAdherence: stats.dailyAdherence
        }
      });
    } catch (error) {
      logger.error('Get medication adherence error:', error);
      throw error;
    }
  }
}

module.exports = new AdherenceController();