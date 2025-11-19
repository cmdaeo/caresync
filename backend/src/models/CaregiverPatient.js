const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaregiverPatient = sequelize.define('CaregiverPatient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  caregiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relationship: {
    type: DataTypes.ENUM(
      'family_member', 
      'spouse', 
      'parent', 
      'child', 
      'sibling', 
      'friend', 
      'professional_caregiver', 
      'home_care_aide', 
      'nurse', 
      'healthcare_provider',
      'other'
    ),
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      view_medications: true,
      view_adherence: true,
      view_reports: true,
      edit_medications: false,
      receive_notifications: true,
      receive_alerts: true,
      emergency_contact: false,
      schedule_adjustments: false
    }
  },
  notificationSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      missed_medications: true,
      low_battery: true,
      device_errors: true,
      refill_reminders: true,
      adherence_reports: false,
      daily_summaries: false
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accessLevel: {
    type: DataTypes.ENUM('read_only', 'partial_access', 'full_access'),
    defaultValue: 'read_only'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastAccess: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priorityLevel: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'emergency'),
    defaultValue: 'normal'
  },
  monitoringFrequency: {
    type: DataTypes.ENUM('real_time', 'hourly', 'daily', 'weekly'),
    defaultValue: 'daily'
  }
}, {
  tableName: 'caregiver_patient',
  timestamps: true,
  indexes: [
    {
      fields: ['caregiverId']
    },
    {
      fields: ['patientId']
    },
    {
      fields: ['isActive']
    },
    {
      unique: true,
      fields: ['caregiverId', 'patientId']
    }
  ]
});

// Instance methods
CaregiverPatient.prototype.canViewMedication = function() {
  return this.permissions.view_medications === true;
};

CaregiverPatient.prototype.canEditMedication = function() {
  return this.permissions.edit_medications === true;
};

CaregiverPatient.prototype.canReceiveNotifications = function() {
  return this.permissions.receive_notifications === true;
};

CaregiverPatient.prototype.canReceiveAlerts = function() {
  return this.permissions.receive_alerts === true;
};

CaregiverPatient.prototype.isEmergencyContact = function() {
  return this.emergencyContact === true;
};

CaregiverPatient.prototype.hasAccess = function() {
  return this.isActive && this.isVerified;
};

CaregiverPatient.prototype.updateLastAccess = function() {
  this.lastAccess = new Date();
  return this.save();
};

// Class methods
CaregiverPatient.findByCaregiver = function(caregiverId) {
  return this.findAll({
    where: { caregiverId, isActive: true },
    include: [
      {
        model: require('./User'),
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }
    ]
  });
};

CaregiverPatient.findByPatient = function(patientId) {
  return this.findAll({
    where: { patientId, isActive: true },
    include: [
      {
        model: require('./User'),
        as: 'caregiver',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }
    ]
  });
};

CaregiverPatient.findEmergencyContacts = function(patientId) {
  return this.findAll({
    where: { 
      patientId, 
      isActive: true, 
      emergencyContact: true,
      isVerified: true 
    },
    include: [
      {
        model: require('./User'),
        as: 'caregiver',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }
    ]
  });
};

module.exports = CaregiverPatient;