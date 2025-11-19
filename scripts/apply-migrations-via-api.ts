// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  throw new Error('Could not extract project ref from URL');
}

async function applyMigrationsViaAPI() {
  try {
    const sqlFile = resolve(__dirname, '../apply-migrations.sql');
    const sql = readFileSync(sqlFile, 'utf-8');
    
    // Split into individual statements (simplified)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    console.log('\n⚠️  Supabase JS client cannot execute raw SQL directly.');
    console.log('\n📋 Please run the migrations manually:');
    console.log('\n1. Open: https://app.supabase.com/project/' + projectRef + '/sql/new');
    console.log('2. Copy the contents of: apply-migrations.sql');
    console.log('3. Paste and click "Run"');
    console.log('\nAlternatively, you can link the project and use: npm run db:migrate');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigrationsViaAPI();


