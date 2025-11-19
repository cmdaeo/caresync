const { Medication, Adherence } = require('../models');
const logger = require('../utils/logger');

class MedicationController {
  /**
   * Get all medications for user with pagination
   */
  async getMedications(req, res) {
    try {
      const { page = 1, limit = 20, status = 'active', search } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = { userId: req.user.id };
      if (status !== 'all') {
        whereClause.isActive = status === 'active';
      }
      if (search) {
        whereClause.name = {
          [require('sequelize').Op.iLike]: `%${search}%`
        };
      }

      const { count, rows: medications } = await Medication.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          medications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get medications error:', error);
      throw error;
    }
  }

  /**
   * Get single medication by ID
   */
  async getMedication(req, res) {
    try {
      const { id } = req.params;
      const { patientId } = req.query;

      const whereClause = {
        id,
        userId: patientId || req.user.id
      };

      const medication = await Medication.findOne({
        where: whereClause,
        include: [{
          model: require('../models/Adherence'),
          as: 'adherence',
          limit: 10,
          order: [['scheduledTime', 'DESC']]
        }]
      });

      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }

      res.json({
        success: true,
        data: {
          medication
        }
      });
    } catch (error) {
      logger.error('Get medication error:', error);
      throw error;
    }
  }

  /**
   * Create new medication
   */
  async createMedication(req, res) {
    try {
      const medicationData = {
        ...req.body,
        userId: req.user.id
      };

      // Set remaining quantity if not provided
      if (!medicationData.remainingQuantity) {
        medicationData.remainingQuantity = medicationData.totalQuantity;
      }

      const medication = await Medication.create(medicationData);

      logger.info(`New medication created: ${medication.name} for user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Medication created successfully',
        data: {
          medication
        }
      });
    } catch (error) {
      logger.error('Create medication error:', error);
      throw error;
    }
  }

  /**
   * Update medication
   */
  async updateMedication(req, res) {
    try {
      const { id } = req.params;
      const { patientId } = req.query;

      const medication = await Medication.findOne({
        where: {
          id,
          userId: patientId || req.user.id
        }
      });

      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }

      // Update medication
      await medication.update(req.body);

      logger.info(`Medication updated: ${medication.name} for user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Medication updated successfully',
        data: {
          medication
        }
      });
    } catch (error) {
      logger.error('Update medication error:', error);
      throw error;
    }
  }

  /**
   * Delete medication (soft delete)
   */
  async deleteMedication(req, res) {
    try {
      const { id } = req.params;
      const { patientId } = req.query;

      const medication = await Medication.findOne({
        where: {
          id,
          userId: patientId || req.user.id
        }
      });

      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }

      // Soft delete by setting isActive to false
      await medication.update({ isActive: false });

      logger.info(`Medication deactivated: ${medication.name} for user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Medication deactivated successfully'
      });
    } catch (error) {
      logger.error('Delete medication error:', error);
      throw error;
    }
  }

  /**
   * Get medications needing refill
   */
  async getRefillNeeded(req, res) {
    try {
      const medications = await Medication.findAll({
        where: {
          userId: req.user.id,
          isActive: true,
          remainingQuantity: { [require('sequelize').Op.lte]: require('sequelize').literal('timesPerDay * 3') }
        },
        order: [['remainingQuantity', 'ASC']]
      });

      const medicationsNeedingRefill = medications.filter(med => med.isRefillDue(3));

      res.json({
        success: true,
        data: {
          medications: medicationsNeedingRefill,
          count: medicationsNeedingRefill.length
        }
      });
    } catch (error) {
      logger.error('Get refill needed error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming doses for next 24 hours
   */
  async getUpcomingDoses(req, res) {
    try {
      const { hours = 24 } = req.query;
      const now = new Date();
      const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));

      const medications = await Medication.findAll({
        where: {
          userId: req.user.id,
          isActive: true,
          startDate: { [require('sequelize').Op.lte]: futureTime },
          [require('sequelize').Op.or]: [
            { endDate: null },
            { endDate: { [require('sequelize').Op.gte]: now } }
          ]
        }
      });

      const upcomingDoses = [];

      // Generate next doses for each medication
      medications.forEach(medication => {
        const nextDoseTime = medication.getNextDoseTime();
        if (nextDoseTime <= futureTime) {
          upcomingDoses.push({
            medicationId: medication.id,
            medicationName: medication.name,
            dosage: medication.dosage,
            scheduledTime: nextDoseTime,
            daysSupply: medication.calculateDaysSupply(),
            isRefillDue: medication.isRefillDue()
          });
        }
      });

      // Sort by scheduled time
      upcomingDoses.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

      res.json({
        success: true,
        data: {
          upcomingDoses,
          totalCount: upcomingDoses.length
        }
      });
    } catch (error) {
      logger.error('Get upcoming doses error:', error);
      throw error;
    }
  }

  /**
   * Refill medication
   */
  async refillMedication(req, res) {
    try {
      const { id } = req.params;
      const { patientId } = req.query;
      const { quantity, refillsRemaining } = req.body;

      const medication = await Medication.findOne({
        where: {
          id,
          userId: patientId || req.user.id
        }
      });

      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }

      // Update medication
      const newRemainingQuantity = medication.remainingQuantity + quantity;
      const updates = {
        remainingQuantity: newRemainingQuantity,
        lastRefillDate: new Date()
      };

      if (refillsRemaining !== undefined) {
        updates.refillsRemaining = refillsRemaining;
      }

      await medication.update(updates);

      logger.info(`Medication refilled: ${medication.name} (+${quantity}) for user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Medication refilled successfully',
        data: {
          medication: {
            ...medication.toJSON(),
            remainingQuantity: newRemainingQuantity,
            lastRefillDate: updates.lastRefillDate
          }
        }
      });
    } catch (error) {
      logger.error('Refill medication error:', error);
      throw error;
    }
  }

  /**
   * Get medication statistics for user
   */
  async getMedicationStats(req, res) {
    try {
      const { period = 'month' } = req.query;

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

      // Get medication counts by status
      const medicationStats = await Medication.findAll({
        where: {
          userId: req.user.id
        },
        attributes: [
          'isActive',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['isActive']
      });

      // Get refill alerts
      const refillAlerts = await Medication.count({
        where: {
          userId: req.user.id,
          isActive: true,
          remainingQuantity: { [require('sequelize').Op.lte]: 10 }
        }
      });

      // Get low supply medications
      const lowSupplyMedications = await Medication.findAll({
        where: {
          userId: req.user.id,
          isActive: true,
          remainingQuantity: { [require('sequelize').Op.lte]: 10 }
        },
        order: [['remainingQuantity', 'ASC']],
        limit: 5
      });

      const stats = {
        totalMedications: medicationStats.reduce((sum, stat) => 
          sum + parseInt(stat.getDataValue('count')), 0),
        activeMedications: medicationStats.find(stat => stat.isActive === true)?.getDataValue('count') || 0,
        inactiveMedications: medicationStats.find(stat => stat.isActive === false)?.getDataValue('count') || 0,
        refillAlerts,
        lowSupplyMedications: lowSupplyMedications.map(med => ({
          id: med.id,
          name: med.name,
          remainingQuantity: med.remainingQuantity,
          totalQuantity: med.totalQuantity
        }))
      };

      res.json({
        success: true,
        data: {
          statistics: stats
        }
      });
    } catch (error) {
      logger.error('Get medication stats error:', error);
      throw error;
    }
  }

  /**
   * Generate medication schedule for next specified days
   */
  async generateSchedule(req, res) {
    try {
      const { days = 7, startDate } = req.query;
      const userMedications = await Medication.findAll({
        where: {
          userId: req.user.id,
          isActive: true
        }
      });

      const schedule = this.generateMedicationSchedule(userMedications, days, startDate);
      
      res.json({
        success: true,
        data: {
          schedule,
          period: `${days} days`,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Generate schedule error:', error);
      throw error;
    }
  }

  /**
   * Generate medication schedule for multiple medications
   * @param {Array} medications - Array of medication objects
   * @param {number} days - Number of days to generate
   * @param {string} startDate - Start date for schedule generation
   * @returns {Array} Generated schedule
   */
  generateMedicationSchedule(medications, days = 7, startDate) {
    const schedule = [];
    const start = startDate ? new Date(startDate) : new Date();
    
    // Group medications by frequency to optimize scheduling
    const frequencyGroups = this.groupMedicationsByFrequency(medications);
    
    // Generate schedule for each day
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      
      const daySchedule = this.generateDaySchedule(currentDate, frequencyGroups);
      schedule.push({
        date: currentDate.toISOString().split('T')[0],
        medications: daySchedule
      });
    }
    
    return schedule;
  }

  /**
   * Group medications by their frequency patterns for efficient scheduling
   * @param {Array} medications - Array of medication objects
   * @returns {Object} Grouped medications
   */
  groupMedicationsByFrequency(medications) {
    const groups = {
      onceDaily: [],
      twiceDaily: [],
      threeTimesDaily: [],
      fourTimesDaily: [],
      everyHours: [],
      customSchedule: [],
      asNeeded: []
    };

    medications.forEach(medication => {
      const frequency = medication.frequency;
      
      if (frequency.timesPerDay === 1) {
        groups.onceDaily.push(medication);
      } else if (frequency.timesPerDay === 2) {
        groups.twiceDaily.push(medication);
      } else if (frequency.timesPerDay === 3) {
        groups.threeTimesDaily.push(medication);
      } else if (frequency.timesPerDay === 4) {
        groups.fourTimesDaily.push(medication);
      } else if (frequency.scheduleType === 'everyHours') {
        groups.everyHours.push(medication);
      } else if (frequency.customTimes) {
        groups.customSchedule.push(medication);
      } else {
        groups.asNeeded.push(medication);
      }
    });

    return groups;
  }

  /**
   * Generate schedule for a specific day
   * @param {Date} date - The date to generate schedule for
   * @param {Object} frequencyGroups - Grouped medications
   * @returns {Array} Day schedule
   */
  generateDaySchedule(date, frequencyGroups) {
    const daySchedule = [];
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();
    
    // Process each frequency group
    for (const [groupName, group] of Object.entries(frequencyGroups)) {
      if (group.length === 0) continue;
      
      switch (groupName) {
        case 'onceDaily':
          daySchedule.push(...this.scheduleOnceDaily(group, date));
          break;
        case 'twiceDaily':
          daySchedule.push(...this.scheduleTwiceDaily(group, date));
          break;
        case 'threeTimesDaily':
          daySchedule.push(...this.scheduleThreeTimesDaily(group, date));
          break;
        case 'fourTimesDaily':
          daySchedule.push(...this.scheduleFourTimesDaily(group, date));
          break;
        case 'everyHours':
          daySchedule.push(...this.scheduleEveryHours(group, date));
          break;
        case 'customSchedule':
          daySchedule.push(...this.scheduleCustomTimes(group, date));
          break;
      }
    }

    // Sort by scheduled time
    return daySchedule.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  /**
   * Schedule medications that are taken once daily
   * @param {Array} medications - Once daily medications
   * @param {Date} date - Target date
   * @returns {Array} Scheduled doses
   */
  scheduleOnceDaily(medications, date) {
    return medications.map(medication => {
      const scheduledTime = this.calculateDailyTime(
        medication.frequency.times[0] || '08:00', 
        date
      );
      
      return this.createScheduleEntry(medication, scheduledTime);
    });
  }

  /**
   * Schedule medications that are taken twice daily
   * @param {Array} medications - Twice daily medications
   * @param {Date} date - Target date
   * @returns {Array} Scheduled doses
   */
  scheduleTwiceDaily(medications, date) {
    const times = this.calculateOptimalTimes('twice', date);
    
    return medications.flatMap(medication => 
      times.map(time => 
        this.createScheduleEntry(medication, time)
      )
    );
  }

  /**
   * Schedule medications that are taken three times daily
   * @param {Array} medications - Three times daily medications
   * @param {Date} date - Target date
   * @returns {Array} Scheduled doses
   */
  scheduleThreeTimesDaily(medications, date) {
    const times = this.calculateOptimalTimes('three', date);
    
    return medications.flatMap(medication => 
      times.map(time => 
        this.createScheduleEntry(medication, time)
      )
    );
  }

  /**
   * Schedule medications that are taken four times daily
   * @param {Array} medications - Four times daily medications
   * @param {Date} date - Target date
   * @returns {Array} Scheduled doses
   */
  scheduleFourTimesDaily(medications, date) {
    const times = this.calculateOptimalTimes('four', date);
    
    return medications.flatMap(medication => 
      times.map(time => 
        this.createScheduleEntry(medication, time)
      )
    );
  }

  /**
   * Schedule medications taken every X hours
   * @param {Array} medications - Every X hours medications
   * @param {Date} date - Target date
   * @returns {Array} Scheduled doses
   */
  scheduleEveryHours(medications, date) {
    const schedules = [];
    
    medications.forEach(medication => {
      const hoursInterval = medication.frequency.hoursInterval || 8;
      const times = this.calculateEveryHoursTimes(hoursInterval, date);
      
      times.forEach(time => {
        schedules.push(this.createScheduleEntry(medication, time));
      });
    });
    
    return schedules;
  }

  /**
   * Schedule medications with custom times
   * @param {Array} medications - Custom schedule medications
   * @param {Date} date - Target date
   * @returns {Array} Scheduled doses
   */
  scheduleCustomTimes(medications, date) {
    return medications.flatMap(medication => {
      const customTimes = medication.frequency.customTimes || [];
      
      return customTimes.map(time => 
        this.createScheduleEntry(medication, time)
      );
    });
  }

  /**
   * Calculate optimal dosing times based on frequency
   * @param {string} frequency - Frequency type ('twice', 'three', 'four')
   * @param {Date} date - Target date
   * @returns {Array} Array of time strings
   */
  calculateOptimalTimes(frequency, date) {
    const times = [];
    const dayStart = 6; // 6 AM
    const dayEnd = 22;  // 10 PM
    const awakeHours = dayEnd - dayStart;
    
    switch (frequency) {
      case 'twice':
        times.push(`${dayStart}:00`, `${dayStart + Math.floor(awakeHours/2)}:00`);
        break;
      case 'three':
        times.push(`${dayStart}:00`, `${dayStart + Math.floor(awakeHours/3)}:00`, `${dayStart + Math.floor(2*awakeHours/3)}:00`);
        break;
      case 'four':
        const interval = Math.floor(awakeHours / 3);
        times.push(`${dayStart}:00`, `${dayStart + interval}:00`, `${dayStart + 2*interval}:00`, `${dayStart + 3*interval}:00`);
        break;
    }
    
    return times.map(time => this.calculateDailyTime(time, date));
  }

  /**
   * Calculate times for medications taken every X hours
   * @param {number} hoursInterval - Hours between doses
   * @param {Date} date - Target date
   * @returns {Array} Array of Date objects
   */
  calculateEveryHoursTimes(hoursInterval, date) {
    const times = [];
    const dayStart = new Date(date);
    dayStart.setHours(6, 0, 0, 0); // Start at 6 AM
    
    let currentTime = new Date(dayStart);
    const dayEnd = new Date(date);
    dayEnd.setHours(22, 0, 0, 0); // End at 10 PM
    
    while (currentTime <= dayEnd) {
      times.push(new Date(currentTime));
      currentTime.setHours(currentTime.getHours() + hoursInterval);
    }
    
    return times;
  }

  /**
   * Calculate daily time by combining time string with date
   * @param {string} timeString - Time in HH:MM format
   * @param {Date} date - Date to combine with time
   * @returns {Date} Combined date and time
   */
  calculateDailyTime(timeString, date) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  /**
   * Create a schedule entry for a medication dose
   * @param {Object} medication - Medication object
   * @param {Date} scheduledTime - When the dose should be taken
   * @returns {Object} Schedule entry
   */
  createScheduleEntry(medication, scheduledTime) {
    return {
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      dosageUnit: medication.dosageUnit,
      scheduledTime: scheduledTime.toISOString(),
      instructions: medication.instructions,
      specialInstructions: medication.specialInstructions,
      route: medication.route,
      icon: this.getMedicationIcon(medication.name),
      color: this.getMedicationColor(medication.name)
    };
  }

  /**
   * Get appropriate icon for medication type
   * @param {string} medicationName - Medication name
   * @returns {string} Emoji icon
   */
  getMedicationIcon(medicationName) {
    const name = medicationName.toLowerCase();
    
    if (name.includes('tablet') || name.includes('pill')) return '💊';
    if (name.includes('liquid') || name.includes('syrup')) return '🧪';
    if (name.includes('injection') || name.includes('shot')) return '💉';
    if (name.includes('cream') || name.includes('ointment')) return '🧴';
    if (name.includes('drop')) return '💧';
    if (name.includes('patch')) return '🩹';
    
    return '💊'; // Default
  }

  /**
   * Get color coding for medication type
   * @param {string} medicationName - Medication name
   * @returns {string} Hex color code
   */
  getMedicationColor(medicationName) {
    const name = medicationName.toLowerCase();
    
    // Different colors for different medication types/categories
    if (name.includes('pain') || name.includes('fever')) return '#FF5722'; // Orange
    if (name.includes('blood pressure') || name.includes('heart')) return '#F44336'; // Red
    if (name.includes('diabetes') || name.includes('sugar')) return '#E91E63'; // Pink
    if (name.includes('vitamins') || name.includes('supplement')) return '#2196F3'; // Blue
    if (name.includes('antibiotic')) return '#4CAF50'; // Green
    if (name.includes('sleep') || name.includes('anxiety')) return '#9C27B0'; // Purple
    
    return '#607D8B'; // Default blue gray
  }
}

module.exports = new MedicationController();