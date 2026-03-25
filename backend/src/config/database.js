const { Sequelize } = require('sequelize');
const path = require('path');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

let piiOptions, medicalOptions;

if (isProduction) {
  // --- PRODUCTION CONFIG (Supabase / Postgres) ---
  // We explicitly require 'pg' here to ensure Vercel's bundler 
  // includes it in the serverless function.
  const pg = require('pg');

  const pgSharedOptions = {
    dialect: 'postgres',
    dialectModule: pg, // CRITICAL: Fixes "Please install pg package manually"
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Supabase external connections
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  // On Vercel, both logical DBs point to the same Supabase instance
  piiOptions = { ...pgSharedOptions };
  medicalOptions = { ...pgSharedOptions };

} else {
  // --- LOCAL CONFIG (SQLite) ---
  // Standard sqlite3 is used locally to avoid the sqlcipher OpenSSL error
  const sqlite3 = require('sqlite3');

  const sqliteSharedOptions = {
    dialect: 'sqlite',
    dialectModule: sqlite3,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  piiOptions = {
    ...sqliteSharedOptions,
    storage: process.env.DB_STORAGE_PII || path.join(__dirname, '../../pii_database.sqlite'),
  };

  medicalOptions = {
    ...sqliteSharedOptions,
    storage: process.env.DB_STORAGE_MEDICAL || path.join(__dirname, '../../medical_database.sqlite'),
  };
}

let sequelizePii;
let sequelizeMedical;

if (isProduction) {
  // Use the full URL string + the pgSharedOptions object
  sequelizePii = new Sequelize(process.env.DATABASE_URL, piiOptions);
  sequelizeMedical = new Sequelize(process.env.DATABASE_URL, medicalOptions);
} else {
  // Use the local SQLite options objects
  sequelizePii = new Sequelize(piiOptions);
  sequelizeMedical = new Sequelize(medicalOptions);
}

module.exports = { sequelizePii, sequelizeMedical };