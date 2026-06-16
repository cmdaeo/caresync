require('dotenv').config();
const { sequelizePii } = require('./src/config/database');

async function check() {
  try {
    const [results] = await sequelizePii.query('SELECT * FROM "caregiver_patients"');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
