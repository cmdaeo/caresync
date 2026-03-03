const { Sequelize } = require('sequelize');
const path = require('path');

const sharedOptions = {
  dialect: process.env.DB_DIALECT || 'sqlite',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// PII Database — Users, CaregiverPatient, AuditLog, ConsentLog, Notification
const sequelizePii = new Sequelize({
  ...sharedOptions,
  storage: process.env.DB_STORAGE_PII || path.join(__dirname, '../../pii_database.sqlite'),
});

// Medical Database — Medication, Adherence, Prescription, Device, DeviceAccessPermission, DeviceInvitation, DocumentMetadata
const sequelizeMedical = new Sequelize({
  ...sharedOptions,
  storage: process.env.DB_STORAGE_MEDICAL || path.join(__dirname, '../../medical_database.sqlite'),
});

module.exports = { sequelizePii, sequelizeMedical };
