// backend/scripts/generateApiDocs.js
require('dotenv').config();
const apiDocGenerator = require('../src/services/apiDocGenerator');

async function generate() {
  console.log('🚀 Generating API documentation...\n');
  
  try {
    await apiDocGenerator.writeToFrontend();
    console.log('\n✨ Done! You can now view the documentation in your showcase.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to generate documentation:', error);
    process.exit(1);
  }
}

generate();
