// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF || 'uazyyjlurexdtlvavalz';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrationViaAPI() {
  try {
    console.log('📋 Applying migration via Supabase Management API...\n');
    
    if (!supabaseAccessToken) {
      console.log('⚠️  SUPABASE_ACCESS_TOKEN not found.');
      console.log('   Cannot apply migration automatically.');
      console.log('   Please apply it manually via Supabase Dashboard > SQL Editor\n');
      return false;
    }
    
    const migrationSQL = readFileSync(
      resolve(__dirname, '../supabase/migrations/20250112000000_add_primary_deliverer_to_routes.sql'),
      'utf-8'
    );
    
    // Use Supabase Management API to execute SQL
    // This requires the project ref and access token
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: migrationSQL
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️  Could not apply migration via API:', errorText);
      console.log('   This might require manual application.\n');
      return false;
    }
    
    console.log('✅ Migration applied successfully!\n');
    return true;
    
  } catch (error: any) {
    console.log('⚠️  Error applying migration via API:', error.message);
    console.log('   Migration may need to be applied manually.\n');
    return false;
  }
}

async function checkAndApplyMigration() {
  // First check if columns exist
  const { error: columnCheckError } = await supabase
    .from('routes')
    .select('primary_deliverer_email, primary_deliverer_id')
    .limit(0);
  
  if (columnCheckError && (
    columnCheckError.message.includes('column') && 
    (columnCheckError.message.includes('does not exist') || 
     columnCheckError.code === '42703')
  )) {
    console.log('❌ Columns do not exist. Attempting to apply migration...\n');
    const applied = await applyMigrationViaAPI();
    
    if (!applied) {
      console.log('📝 Please apply the migration manually:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy and paste the SQL from: supabase/migrations/20250112000000_add_primary_deliverer_to_routes.sql');
      console.log('   3. Click "Run"\n');
      throw new Error('Migration columns not found. Please apply migration first.');
    }
    
    // Wait a moment for migration to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify columns exist now
    const { error: verifyError } = await supabase
      .from('routes')
      .select('primary_deliverer_email, primary_deliverer_id')
      .limit(0);
    
    if (verifyError) {
      throw new Error('Migration may not have applied correctly. Please verify manually.');
    }
    
    console.log('✅ Migration verified!\n');
  } else {
    console.log('✅ Migration columns already exist!\n');
  }
}

checkAndApplyMigration().catch(console.error);


