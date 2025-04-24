import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Derive __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct absolute path to .env.local in the root folder (parent of server)
const envPath = join(__dirname, '..', '.env.local');

// Debugging Tip 1: Verify if .env.local exists
if (fs.existsSync(envPath)) {
  console.log(`✔️ .env.local found at: ${envPath}`);
} else {
  console.error(`❌ .env.local not found at: ${envPath}`);
  console.log('Ensure .env.local is in the project root (e.g., /Users/mac/game-ui/) and is readable.');
}

// Debugging Tip 2: Load environment variables with error handling
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env.local:', result.error.message);
  console.log('Possible causes:');
  console.log('- File is missing or path is incorrect.');
  console.log('- File permissions prevent reading.');
  console.log('- Syntax error in .env.local (e.g., invalid format).');
} else {
  console.log('✔️ Successfully loaded .env.local');
}

// Debugging Tip 3: Log environment variables to verify they are loaded
console.log('Environment Variables:');
console.log('RELAYER_PRIVATE_KEY:', process.env.RELAYER_PRIVATE_KEY || 'undefined');
console.log('REACT_APP_RELAYER_ADDRESS:', process.env.REACT_APP_RELAYER_ADDRESS || 'undefined');
console.log('RPC_URL:', process.env.RPC_URL || 'undefined');

// Debugging Tip 4: Optional - Read and log .env.local content for manual inspection
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  console.log('\nDebug: Content of .env.local:');
  console.log(envContent);
} catch (err) {
  console.error('❌ Error reading .env.local content:', err.message);
}