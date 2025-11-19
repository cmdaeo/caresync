const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Adherence = sequelize.define('Adherence', {
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
  medicationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'medications',
      key: 'id'
    }
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  takenTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'taken', 'missed', 'delayed', 'skipped'),
    defaultValue: 'scheduled'
  },
  dosageTaken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  confirmationMethod: {
    type: DataTypes.ENUM('manual', 'automated', 'device', 'nfc', 'caregiver'),
    allowNull: true
  },
  deviceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'devices',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sideEffects: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  delayMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  vitalSigns: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  isEmergency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emergencyReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  caregiverNotified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dataSource: {
    type: DataTypes.ENUM('carebox', 'careband', 'mobile_app', 'web_portal', 'manual_entry'),
    allowNull: false
  },
  syncStatus: {
    type: DataTypes.ENUM('synced', 'pending', 'conflict'),
    defaultValue: 'pending'
  },
  lastSyncTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'adherence',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['medicationId']
    },
    {
      fields: ['scheduledTime']
    },
    {
      fields: ['status']
    },
    {
      fields: ['dataSource']
    },
    {
      fields: ['userId', 'scheduledTime']
    }
  ]
});

// Instance methods
Adherence.prototype.calculateAdherence = function() {
  if (!this.takenTime) return false;
  
  const scheduled = new Date(this.scheduledTime);
  const taken = new Date(this.takenTime);
  const timeDiff = Math.abs(taken - scheduled);
  const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
  
  // Consider on-time if taken within 15 minutes of scheduled time
  return minutesDiff <= 15;
};

Adherence.prototype.getDelayMinutes = function() {
  if (!this.takenTime) return null;
  
  const scheduled = new Date(this.scheduledTime);
  const taken = new Date(this.takenTime);
  const timeDiff = taken - scheduled;
  
  return Math.ceil(timeDiff / (1000 * 60));
};

Adherence.prototype.isLate = function(minutesThreshold = 30) {
  if (!this.takenTime) return true;
  
  const scheduled = new Date(this.scheduledTime);
  const taken = new Date(this.takenTime);
  const timeDiff = taken - scheduled;
  
  return timeDiff > (minutesThreshold * 60 * 1000);
};

module.exports = Adherence;