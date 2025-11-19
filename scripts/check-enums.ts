// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function checkEnums() {
  try {
    // Try to query enum values by attempting inserts with different values
    // Or query information_schema
    console.log('Checking enum values...\n');
    
    // Try to get enum values via a query
    // We'll try common values and see what works
    const testValues = {
      status: ['active', 'Active', 'ACTIVE', 'current', 'Current', 'CURRENT', 'enabled', 'Enabled'],
      tier: ['household', 'Household', 'HOUSEHOLD', 'individual', 'Individual', 'INDIVIDUAL', 'senior', 'Senior', 'SENIOR', 'student', 'Student', 'STUDENT']
    };
    
    console.log('Trying to determine enum values by checking existing data...');
    
    // Check if there are any existing memberships to see what values they use
    const { data: existing } = await supabase
      .from('memberships')
      .select('status, tier')
      .limit(10);
    
    if (existing && existing.length > 0) {
      console.log('\nExisting membership values:');
      const statuses = [...new Set(existing.map(m => m.status).filter(Boolean))];
      const tiers = [...new Set(existing.map(m => m.tier).filter(Boolean))];
      console.log('Status values found:', statuses);
      console.log('Tier values found:', tiers);
    } else {
      console.log('No existing memberships found.');
      console.log('\n💡 We need to check the enum definition in Supabase.');
      console.log('   Run this SQL in Supabase SQL Editor:');
      console.log('   SELECT unnest(enum_range(NULL::membership_status_enum));');
      console.log('   SELECT unnest(enum_range(NULL::membership_tier_enum));');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnums();


