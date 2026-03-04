const logger = require('./src/utils/logger');
const { scrubPHI } = require('./src/utils/phiScrubber');

console.log('=== Testing phiScrubber directly ===');
const testCases = [
  'Patient John Doe has email john.doe@example.com and phone 555-123-4567',
  { 
    patient: 'Mr. Smith', 
    dob: '01/15/1980', 
    ssn: '123-45-6789', 
    contact: {
      email: 'jane.smith@healthcare.org',
      phone: '+1 (555) 987-6543'
    },
    prescriptions: ['Rx #1234567', 'Prescription #890123']
  },
  ['Patient Johnson', '1990-05-20', 'MRN #987654321']
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest Case ${index + 1}:`);
  console.log('Input:', JSON.stringify(testCase, null, 2));
  console.log('Output:', JSON.stringify(scrubPHI(testCase), null, 2));
});

console.log('\n=== Testing logger.info ===');
logger.info('Patient John Doe has email john.doe@example.com and phone 555-123-4567');
logger.info('Patient %s has email %s and phone %s', 'Jane Smith', 'jane.smith@test.com', '555-987-6543');
logger.info('Patient data: %j', { 
  name: 'Dr. Brown', 
  dob: '12/31/1975', 
  ssn: '987-65-4321',
  mrn: 'MRN #123456'
});

console.log('\n=== Testing logger.error ===');
logger.error(new Error('Failed to process patient data for John Doe with email john.doe@hospital.org'));
