const sequelize = require('../config/database');
const User = require('./User');
const Medication = require('./Medication');
const Prescription = require('./Prescription');
const Adherence = require('./Adherence');
const Device = require('./Device');
const CaregiverPatient = require('./CaregiverPatient');
const Notification = require('./Notification');

// Define associations

// User associations
User.hasMany(Medication, { foreignKey: 'userId', as: 'medications' });
User.hasMany(Prescription, { foreignKey: 'userId', as: 'prescriptions' });
User.hasMany(Adherence, { foreignKey: 'userId', as: 'adherenceRecords' });
User.hasMany(Device, { foreignKey: 'userId', as: 'devices' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(Notification, { foreignKey: 'caregiverId', as: 'caregiverNotifications' });
User.hasMany(CaregiverPatient, { foreignKey: 'caregiverId', as: 'caregiving' });
User.hasMany(CaregiverPatient, { foreignKey: 'patientId', as: 'careReceiving' });

// Medication associations
Medication.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Medication.hasMany(Adherence, { foreignKey: 'medicationId', as: 'adherence' });

// Prescription associations
Prescription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Prescription.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Adherence associations
Adherence.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Adherence.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medication' });
Adherence.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });

// Device associations
Device.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Device.hasMany(Adherence, { foreignKey: 'deviceId', as: 'adherenceRecords' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'patient' });
Notification.belongsTo(User, { foreignKey: 'caregiverId', as: 'caregiver' });

// CaregiverPatient associations
CaregiverPatient.belongsTo(User, { foreignKey: 'caregiverId', as: 'caregiver' });
CaregiverPatient.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Medication,
  Prescription,
  Adherence,
  Device,
  Notification,
  CaregiverPatient
};

// Export individual models for use in routes and services
module.exports.User = User;
module.exports.Medication = Medication;
module.exports.Prescription = Prescription;
module.exports.Adherence = Adherence;
module.exports.Device = Device;
module.exports.Notification = Notification;
module.exports.CaregiverPatient = CaregiverPatient;