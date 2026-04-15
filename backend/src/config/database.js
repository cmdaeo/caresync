const { Sequelize } = require('sequelize');
const path = require('path');
const sqlcipher = require('@journeyapps/sqlcipher');

// ── SQLCipher encryption key (required) ──────────────────────
const SQLCIPHER_KEY = process.env.SQLCIPHER_KEY;
if (!SQLCIPHER_KEY) {
  throw new Error('SQLCIPHER_KEY environment variable is required for database encryption');
}

const sharedOptions = {
  dialect: process.env.DB_DIALECT || 'sqlite',
  dialectModule: sqlcipher,
  password: SQLCIPHER_KEY,
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
