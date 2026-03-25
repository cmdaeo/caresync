const { Sequelize } = require('sequelize');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// ── Database Configuration ──────────────────────
let piiOptions, medicalOptions;

if (isProduction) {
  // PRODUCTION: Supabase (Postgres)
  const pgOptions = {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Supabase/Vercel
      }
    },
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  };

  piiOptions = { ...pgOptions, database: 'postgres' }; // Both point to the same Supabase instance
  medicalOptions = { ...pgOptions, database: 'postgres' };
} else {
  // LOCAL: SQLite (Standard)
  // We swap 'sqlcipher' for standard 'sqlite3' to avoid the Vercel crash
  const sqlite3 = require('sqlite3'); 
  
  const localShared = {
    dialect: 'sqlite',
    dialectModule: sqlite3,
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  };

  piiOptions = { 
    ...localShared, 
    storage: process.env.DB_STORAGE_PII || path.join(__dirname, '../../pii_database.sqlite') 
  };
  
  medicalOptions = { 
    ...localShared, 
    storage: process.env.DB_STORAGE_MEDICAL || path.join(__dirname, '../../medical_database.sqlite') 
  };
}

// Initialize Instances
const sequelizePii = new Sequelize(isProduction ? process.env.DATABASE_URL : piiOptions, piiOptions);
const sequelizeMedical = new Sequelize(isProduction ? process.env.DATABASE_URL : medicalOptions, medicalOptions);

module.exports = { sequelizePii, sequelizeMedical };