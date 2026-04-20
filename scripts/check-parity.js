/**
 * EventPulse Environment Parity Checker
 * Validates that the runtime environment has all necessary 
 * Google Cloud and Firebase secrets required for production stability.
 */
require('dotenv').config({ path: 'backend/.env' });

const REQUIRED_VARS = [
  'GEMINI_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_DATABASE_URL',
  'MAPS_API_KEY'
];

function checkParity() {
  console.log('--- EventPulse Environment Parity Audit ---');
  let missing = 0;

  REQUIRED_VARS.forEach(v => {
    if (!process.env[v]) {
      console.error(`[FAIL] Missing: ${v}`);
      missing++;
    } else {
      console.log(`[PASS] Found: ${v}`);
    }
  });

  if (missing === 0) {
    console.log('\n[SUCCESS] Environment is parity-ready for Google Cloud Run.');
    process.exit(0);
  } else {
    console.error(`\n[ERROR] ${missing} variables missing. Parity check failed.`);
    process.exit(1);
  }
}

if (require.main === module) {
  checkParity();
}
