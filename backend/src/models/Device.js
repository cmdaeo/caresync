const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
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
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deviceType: {
    type: DataTypes.ENUM('carebox', 'careband'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  firmwareVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hardwareVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  batteryLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  batteryStatus: {
    type: DataTypes.ENUM('charging', 'full', 'low', 'critical', 'unknown'),
    defaultValue: 'unknown'
  },
  connectionStatus: {
    type: DataTypes.ENUM('online', 'offline', 'syncing', 'error'),
    defaultValue: 'offline'
  },
  lastConnection: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastSync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nfcId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pairingToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPaired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  status: {
    type: DataTypes.JSON,
    defaultValue: {
      temperature: null,
      humidity: null,
      doorStatus: 'closed',
      motorStatus: 'idle',
      lastError: null,
      errorCount: 0
    }
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  registrationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastMaintenance: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextMaintenance: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isUnderWarranty: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  warrantyExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'devices',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['deviceType']
    },
    {
      fields: ['deviceId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['connectionStatus']
    }
  ]
});

// Instance methods
Device.prototype.isOnline = function() {
  return this.connectionStatus === 'online';
};

Device.prototype.needsMaintenance = function() {
  if (!this.nextMaintenance) return false;
  const today = new Date();
  const maintenanceDate = new Date(this.nextMaintenance);
  return today >= maintenanceDate;
};

Device.prototype.getDaysSinceLastSync = function() {
  if (!this.lastSync) return null;
  const today = new Date();
  const lastSync = new Date(this.lastSync);
  return Math.ceil((today - lastSync) / (1000 * 60 * 60 * 24));
};

Device.prototype.updateStatus = function(newStatus) {
  this.status = { ...this.status, ...newStatus };
  return this.save();
};

Device.prototype.batteryIsLow = function(threshold = 20) {
  return this.batteryLevel !== null && this.batteryLevel <= threshold;
};

module.exports = Device;