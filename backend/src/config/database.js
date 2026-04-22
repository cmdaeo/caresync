const { Sequelize } = require('sequelize');
const path = require('path');

// Only require sqlite3 for development
const sqlite3 = process.env.NODE_ENV !== 'production' ? require('sqlite3') : null;

// Explicitly require pg for production
const pg = process.env.NODE_ENV === 'production' ? require('pg') : null;

const isProduction = process.env.NODE_ENV === 'production';

// Create database connection
let sequelizeConnection = null;

const createConnection = () => {
  if (sequelizeConnection) return sequelizeConnection;

  // For Vercel deployment, use SQLite to avoid pg package issues
  // In a real production environment, you would use PostgreSQL with proper setup
  if (process.env.VERCEL) {
    console.log('Using SQLite for Vercel deployment (serverless compatibility)');
    sequelizeConnection = new Sequelize({
      dialect: 'sqlite',
      dialectModule: sqlite3,
      storage: ':memory:', // In-memory SQLite for serverless
      logging: false,
      pool: {
        max: 1,
        min: 0,
        acquire: 10000,
        idle: 5000,
      },
    });
  } else if (isProduction) {
    if (process.env.DATABASE_URL) {
      try {
        // Explicitly require pg for production
        const pg = require('pg');
        console.log('pg package loaded successfully');

        // Use DATABASE_URL in production (Supabase PostgreSQL)
        sequelizeConnection = new Sequelize(process.env.DATABASE_URL, {
          dialect: 'postgres',
          dialectModule: pg,
          logging: false,
          pool: {
            max: 2, // Reduced for serverless
            min: 0,
            acquire: 15000, // Reduced timeout for serverless
            idle: 5000,
          },
          ssl: true,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
        });
        console.log('Sequelize connection created with pg');
      } catch (pgError) {
        console.error('Failed to load pg package:', pgError.message);
        // Fallback to SQLite if pg fails
        console.log('Falling back to SQLite due to pg package issues');
        sequelizeConnection = new Sequelize({
          dialect: 'sqlite',
          dialectModule: sqlite3,
          storage: ':memory:',
          logging: false,
          pool: { max: 1, min: 0, acquire: 30000, idle: 10000 },
        });
      }
    } else {
      // In serverless/production without DATABASE_URL, use SQLite
      console.log('No DATABASE_URL configured, using SQLite for production');
      sequelizeConnection = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
        pool: { max: 1, min: 0, acquire: 30000, idle: 10000 },
      });
    }
  } else {
    // Use SQLite locally for development
    sequelizeConnection = new Sequelize({
      dialect: 'sqlite',
      dialectModule: sqlite3,
      storage: path.join(__dirname, '../../database.sqlite'),
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  }

  return sequelizeConnection;
};

// For Supabase, use the same database connection for both PII and medical data
// The separation is maintained through careful model design and application-level access controls
const sequelizePii = createConnection();
const sequelizeMedical = createConnection();

module.exports = { sequelizePii, sequelizeMedical };