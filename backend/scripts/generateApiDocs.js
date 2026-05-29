#!/usr/bin/env node
/**
 * generateApiDocs.js
 *
 * CLI script to generate the public API documentation JSON file.
 * Reads all Swagger JSDoc annotations from routes/ and enriches them
 * with GDPR/HIPAA privacy metadata via apiDocGenerator service.
 *
 * Output: frontend/public/api-docs.json
 *
 * Usage:
 *   node scripts/generateApiDocs.js
 *   npm run generate-docs
 *
 * Environment:
 *   Requires .env to be present (loaded automatically).
 *   NODE_ENV does not need to be 'development' for this script.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const apiDocGenerator = require('../src/services/apiDocGenerator');

async function generate() {
  console.log('');
  console.log('📚 CareSync — API Documentation Generator');
  console.log('==========================================');
  console.log('Reading Swagger JSDoc annotations from routes/...');
  console.log('');

  try {
    const result = await apiDocGenerator.writeToFrontend();

    console.log('');
    console.log('==========================================');
    console.log(`✅ Documentation generated successfully!`);
    console.log(`📁 Output: ${result.filePath}`);
    console.log(`📊 Total endpoints documented: ${result.totalEndpoints}`);
    console.log('');
    console.log('Each endpoint includes:');
    console.log('  • HTTP method, path, description, tags');
    console.log('  • Authentication requirement');
    console.log('  • Rate limit policy');
    console.log('  • GDPR: dataCollected, dataShared, retention');
    console.log('  • HIPAA/GDPR compliance flags');
    console.log('  • Auto-generated request/response examples');
    console.log('');
    console.log('You can now view the documentation in the frontend showcase.');
    console.log('==========================================');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('==========================================');
    console.error('❌ Failed to generate documentation');
    console.error('');
    console.error('Error:', error.message);

    if (process.env.NODE_ENV === 'development' || process.env.VERBOSE_LOGGING === 'true') {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }

    console.error('');
    console.error('Common causes:');
    console.error('  • Missing .env file — copy .env.example and fill in values');
    console.error('  • Invalid swagger JSDoc annotations in a route file');
    console.error('  • frontend/public/ directory does not exist (will be created automatically)');
    console.error('==========================================');
    console.error('');

    process.exit(1);
  }
}

generate();