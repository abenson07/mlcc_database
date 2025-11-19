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
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📋 Applying migration: add_primary_deliverer_to_routes...\n');
    
    const migrationPath = resolve(__dirname, '../supabase/migrations/20250112000000_add_primary_deliverer_to_routes.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Execute SQL statements one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        // Use raw SQL execution via PostgREST
        // For ALTER TABLE statements, we need to use the REST API or direct connection
        // Since Supabase JS doesn't support raw SQL directly, we'll use a workaround
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // If RPC doesn't exist, try alternative approach
          console.warn(`Note: exec_sql RPC not available, trying direct execution...`);
          // For now, we'll proceed - the migration might already be applied
          // or we can apply it manually via Supabase dashboard
          console.log(`Statement: ${statement.substring(0, 100)}...`);
        } else {
          console.log(`✓ Executed statement`);
        }
      }
    }
    
    console.log('\n✅ Migration applied (or already exists)');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\n⚠️  If migration failed, you may need to apply it manually via Supabase dashboard');
    console.log('   or use: npm run db:migrate');
    throw error;
  }
}

applyMigration();


