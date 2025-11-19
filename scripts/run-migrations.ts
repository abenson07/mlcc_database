// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'uazyyjlurexdtlvavalz'; // From your URL

if (!accessToken) {
  throw new Error('Missing SUPABASE_ACCESS_TOKEN in .env.local');
}

async function runMigrations() {
  try {
    console.log('🚀 Running migrations via Supabase CLI...\n');
    
    // Set the access token as environment variable for the CLI
    process.env.SUPABASE_ACCESS_TOKEN = accessToken;
    
    // First, try to link if not already linked (non-interactive)
    console.log('📎 Linking project...');
    try {
      execSync(
        `npx supabase link --project-ref ${projectRef} --password "${process.env.SUPABASE_DB_PASSWORD || ''}"`,
        { 
          stdio: 'inherit',
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
        }
      );
    } catch (error: any) {
      // If already linked or other error, continue
      if (!error.message?.includes('already linked')) {
        console.log('Note: Link step had issues, continuing...');
      }
    }
    
    // Push migrations
    console.log('\n📤 Pushing migrations...');
    execSync(
      'npx supabase db push',
      { 
        stdio: 'inherit',
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
        cwd: resolve(__dirname, '..')
      }
    );
    
    console.log('\n✅ Migrations applied successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Error running migrations:', error.message);
    if (error.stdout) console.error('Output:', error.stdout.toString());
    if (error.stderr) console.error('Error:', error.stderr.toString());
    process.exit(1);
  }
}

runMigrations();


