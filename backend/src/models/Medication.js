const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medication = sequelize.define('Medication', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  genericName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  brandName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  dosageUnit: {
    type: DataTypes.ENUM('mg', 'ml', 'tablets', 'capsules', 'drops', 'units', 'puffs'),
    allowNull: false
  },
  frequency: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      timesPerDay: 1,
      times: ['08:00'],
      withMeals: false,
      beforeOrAfterMeals: 'with'
    }
  },
  route: {
    type: DataTypes.ENUM('oral', 'topical', 'injection', 'inhalation', 'sublingual', 'rectal', 'other'),
    defaultValue: 'oral'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  remainingQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  refillsRemaining: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sideEffects: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contraindications: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interactions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  storageConditions: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shape: {
    type: DataTypes.STRING,
    allowNull: true
  },
  imprint: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prescriptionRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPRN: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxDailyDose: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  scheduleOverride: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  customSchedule: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  lastRefillDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextRefillDue: {
    type: DataTypes.DATE,
    allowNull: true
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ndc: {
    type: DataTypes.STRING,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'medications',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['name']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Instance methods
Medication.prototype.calculateDaysSupply = function() {
  if (this.remainingQuantity <= 0) return 0;
  
  const dailyDoses = this.frequency.timesPerDay || 1;
  const totalDailyDose = dailyDoses;
  
  return Math.floor(this.remainingQuantity / totalDailyDose);
};

Medication.prototype.isRefillDue = function(daysThreshold = 3) {
  const daysSupply = this.calculateDaysSupply();
  return daysSupply <= daysThreshold;
};

Medication.prototype.getNextDoseTime = function() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const times = this.frequency.times || ['08:00'];
  
  for (const time of times) {
    const doseTime = new Date(`${today}T${time}:00`);
    if (doseTime > now) {
      return doseTime;
    }
  }
  
  // If no doses left today, return tomorrow's first dose
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return new Date(`${tomorrowStr}T${times[0]}:00`);
};

module.exports = Medication;