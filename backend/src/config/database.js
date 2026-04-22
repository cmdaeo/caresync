const { Sequelize } = require('sequelize');
const path = require('path');
// Change: Import standard sqlite3 instead of sqlcipher
const sqlite3 = require('sqlite3');

const sharedOptions = {
  dialect: 'sqlite',
  // Change: Use the standard sqlite3 module
  dialectModule: sqlite3,
  // Note: Standard sqlite3 doesn't use the 'password' field for encryption
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// PII Database
const sequelizePii = new Sequelize({
  ...sharedOptions,
  storage: process.env.DB_STORAGE_PII || path.join(__dirname, '../../pii_database.sqlite'),
});

// Medical Database
const sequelizeMedical = new Sequelize({
  ...sharedOptions,
  storage: process.env.DB_STORAGE_MEDICAL || path.join(__dirname, '../../medical_database.sqlite'),
});

module.exports = { sequelizePii, sequelizeMedical };