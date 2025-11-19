// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'uazyyjlurexdtlvavalz';

if (!accessToken) {
  throw new Error('Missing SUPABASE_ACCESS_TOKEN in .env.local');
}

async function applyMigrationsViaManagementAPI() {
  try {
    console.log('🚀 Applying migrations via Supabase Management API...\n');
    
    const sqlFile = resolve(__dirname, '../apply-migrations.sql');
    let sql = readFileSync(sqlFile, 'utf-8');
    
    // Remove comments and SELECT statements (verification queries)
    sql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('SELECT'))
      .join('\n');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.includes('DO $$'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Use Supabase Management API to execute SQL
    // Note: This endpoint may require different authentication or may not be publicly available
    // Let's try the database query endpoint
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    console.log('⚠️  Attempting to use Management API...');
    console.log('If this fails, we\'ll use the SQL Editor approach.\n');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const response = await fetch(managementApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: statement + ';'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`⚠️  API returned ${response.status}: ${errorText.substring(0, 200)}`);
          console.log('\n📋 Management API may not support direct SQL execution.');
          console.log('📝 Please use the SQL Editor approach instead:');
          console.log('   1. Open: https://app.supabase.com/project/' + projectRef + '/sql/new');
          console.log('   2. Copy contents of: apply-migrations.sql');
          console.log('   3. Paste and run');
          break;
        } else {
          const result = await response.json();
          console.log(`✅ Statement ${i + 1} executed`);
        }
      } catch (error: any) {
        console.log(`⚠️  Error on statement ${i + 1}: ${error.message}`);
        console.log('\n📋 Falling back to manual SQL Editor approach.');
        console.log('📝 Please run apply-migrations.sql in the Supabase SQL Editor.');
        break;
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.log('\n📋 Please run apply-migrations.sql manually in the Supabase SQL Editor.');
  }
}

applyMigrationsViaManagementAPI();


