// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'uazyyjlurexdtlvavalz';

if (!accessToken) {
  throw new Error('Missing SUPABASE_ACCESS_TOKEN in .env.local');
}

async function runMigrations() {
  try {
    console.log('🚀 Running migrations via Supabase CLI...\n');
    
    // Set environment for CLI
    const env = {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: accessToken
    };
    
    // Try linking first with the access token
    console.log('📎 Linking project (this may prompt for database password)...');
    try {
      execSync(
        `npx supabase link --project-ref ${projectRef}`,
        { 
          stdio: 'inherit',
          env: env,
          cwd: resolve(__dirname, '..')
        }
      );
      console.log('✅ Project linked successfully!\n');
    } catch (error: any) {
      // Check if already linked
      if (error.message?.includes('already linked') || error.status === 0) {
        console.log('✅ Project already linked\n');
      } else {
        console.log('⚠️  Link had issues, but continuing...\n');
      }
    }
    
    // Push migrations
    console.log('📤 Pushing migrations to database...');
    execSync(
      'npx supabase db push',
      { 
        stdio: 'inherit',
        env: env,
        cwd: resolve(__dirname, '..')
      }
    );
    
    console.log('\n✅ Migrations applied successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Error running migrations:', error.message);
    if (error.stdout) console.error('Output:', error.stdout.toString());
    if (error.stderr) console.error('Error:', error.stderr.toString());
    
    console.log('\n💡 If linking failed, you may need to:');
    console.log('   1. Run: npx supabase login');
    console.log('   2. Then run: npx supabase link --project-ref uazyyjlurexdtlvavalz');
    console.log('   3. Or run the SQL manually in Supabase SQL Editor');
    
    process.exit(1);
  }
}

runMigrations();


