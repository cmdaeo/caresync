require('dotenv').config();
const { sequelizePii } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Authenticating...');
    await sequelizePii.authenticate();
    console.log('Altering table...');
    await sequelizePii.query(`
      ALTER TABLE "caregiver_patients"
      ADD COLUMN "initiatedBy" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
