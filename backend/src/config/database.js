const { Sequelize } = require('sequelize');
const path = require('path');

// Only require sqlite3 for development
const sqlite3 = process.env.NODE_ENV !== 'production' ? require('sqlite3') : null;

const isProduction = process.env.NODE_ENV === 'production';

const createConnection = (dbName) => {
  if (isProduction && process.env.DATABASE_URL) {
    // Use DATABASE_URL in production (Supabase PostgreSQL)
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      ssl: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    });
  } else {
    // Use SQLite locally for development
    return new Sequelize({
      dialect: 'sqlite',
      dialectModule: sqlite3,
      storage: path.join(__dirname, `../../${dbName}.sqlite`),
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  }
};

const sequelizePii = createConnection('pii_database');
const sequelizeMedical = createConnection('medical_database');

module.exports = { sequelizePii, sequelizeMedical };