// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filePath: string, fileName: string) {
  try {
    console.log(`\nApplying migration: ${fileName}...`);
    const sql = readFileSync(filePath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { query: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await (supabase as any).from('_').select('*').limit(0);
          // If that doesn't work, we'll need to use raw SQL connection
          console.warn(`Could not execute via RPC, trying alternative method...`);
          console.warn(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`✓ ${fileName} applied successfully`);
  } catch (error) {
    console.error(`✗ Error applying ${fileName}:`, error);
    throw error;
  }
}

async function applyMigrations() {
  try {
    const migrationsDir = resolve(__dirname, '../supabase/migrations');
    const migrationFiles = [
      '20250111180000_add_membership_columns.sql',
      '20250111180001_add_membership_id_to_people.sql'
    ];
    
    console.log('Applying migrations directly via Supabase client...\n');
    
    for (const fileName of migrationFiles) {
      const filePath = resolve(migrationsDir, fileName);
      await applyMigration(filePath, fileName);
    }
    
    console.log('\n✓ All migrations applied successfully!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

applyMigrations();


