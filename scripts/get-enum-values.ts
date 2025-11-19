// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'uazyyjlurexdtlvavalz';

if (!accessToken) {
  throw new Error('Missing SUPABASE_ACCESS_TOKEN in .env.local');
}

async function getEnumValues() {
  try {
    console.log('🔍 Querying enum values via Management API...\n');
    
    const queries = [
      "SELECT unnest(enum_range(NULL::membership_status_enum)) as status_value;",
      "SELECT unnest(enum_range(NULL::membership_tier_enum)) as tier_value;"
    ];
    
    // Try alternative enum names
    const altQueries = [
      "SELECT unnest(enum_range(NULL::membership_status)) as status_value;",
      "SELECT unnest(enum_range(NULL::membership_tier)) as tier_value;",
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'membership_status_enum');",
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'membership_tier_enum');"
    ];
    
    const allQueries = [...queries, ...altQueries];
    
    for (const query of allQueries) {
      try {
        const response = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Query succeeded: ${query.substring(0, 60)}...`);
          console.log('Result:', JSON.stringify(result, null, 2));
          console.log('');
        }
      } catch (error: any) {
        // Continue to next query
      }
    }
    
    console.log('\n📋 If queries failed, run this SQL in Supabase SQL Editor:');
    console.log('\n-- Check status enum:');
    console.log("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname LIKE '%status%' AND typname LIKE '%membership%');");
    console.log('\n-- Check tier enum:');
    console.log("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname LIKE '%tier%' AND typname LIKE '%membership%');");
    console.log('\n-- Or list all enums:');
    console.log("SELECT typname FROM pg_type WHERE typtype = 'e' AND typname LIKE '%membership%';");
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getEnumValues();


