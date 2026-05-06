// PostgreSQL database configuration — Supabase via DATABASE_URL (all environments)

const { Sequelize } = require('sequelize');

const createConnection = () => {
  const pg = require('pg');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required. Set it in your .env file.\n' +
      'Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname'
    );
  }

  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    pool: {
      max: process.env.VERCEL ? 2 : 5,
      min: 0,
      acquire: 15000,
      idle: 5000,
      evict: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      // Force IPv4 — prevents ETIMEDOUT on systems that resolve to IPv6
      family: 4,
    },
  });

  return sequelize;
};

// Single PostgreSQL database for all data.
// Both exports point to the same instance — keeps existing require() calls
// working without changes. Schema separation is handled at the table level.
const sequelize = createConnection();
const sequelizePii = sequelize;
const sequelizeMedical = sequelize;

module.exports = { sequelizePii, sequelizeMedical };