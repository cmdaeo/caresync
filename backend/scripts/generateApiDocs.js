// backend/scripts/generateApiDocs.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const apiDocGenerator = require('../src/services/apiDocGenerator');

async function main() {
  try {
    await apiDocGenerator.writeToFrontend();
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate API docs:', error);
    process.exit(1);
  }
}

main();