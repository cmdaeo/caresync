// Test database connection and model loading
require('dotenv').config({ path: '../.env' });

console.log('Testing database connection and model loading...');

try {
  const { sequelizePii } = require('./src/config/database');

  console.log('Testing database authentication...');
  sequelizePii.authenticate()
    .then(() => {
      console.log('✅ Database connection successful');

      console.log('Testing model loading...');
      const models = require('./src/models');

      console.log('✅ Models loaded successfully');
      console.log('Available models:', Object.keys(models).filter(key => key !== 'sequelizePii' && key !== 'sequelizeMedical' && key !== 'Sequelize'));

    })
    .catch(error => {
      console.log('❌ Database connection failed:', error.message);
    });

} catch (error) {
  console.log('❌ Setup failed:', error.message);
}