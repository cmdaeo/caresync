const { Sequelize } = require('sequelize');
const path = require('path');

// Only require sqlite3 for development
const sqlite3 = process.env.NODE_ENV !== 'production' ? require('sqlite3') : null;

const isProduction = process.env.NODE_ENV === 'production';

// Create database connection
let sequelizeConnection = null;

const createConnection = () => {
  if (sequelizeConnection) return sequelizeConnection;

  if (isProduction) {
    if (process.env.DATABASE_URL) {
      // Use DATABASE_URL in production (Supabase PostgreSQL)
      sequelizeConnection = new Sequelize(process.env.DATABASE_URL, {
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
      // In serverless/production without DATABASE_URL, create a dummy connection
      console.warn('No DATABASE_URL configured for production. Database operations will fail.');
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