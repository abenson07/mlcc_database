// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  try {
    // Try to query people with membership_id
    const { data: peopleSample } = await supabase
      .from('people')
      .select('*')
      .limit(1);
    
    if (peopleSample && peopleSample.length > 0) {
      console.log('\n=== PEOPLE TABLE COLUMNS ===');
      console.log('Columns:', Object.keys(peopleSample[0]));
      console.log('Has membership_id:', 'membership_id' in peopleSample[0]);
    }
    
    // Try to query memberships
    const { data: memSample } = await supabase
      .from('memberships')
      .select('*')
      .limit(1);
    
    if (memSample && memSample.length > 0) {
      console.log('\n=== MEMBERSHIPS TABLE COLUMNS ===');
      console.log('Columns:', Object.keys(memSample[0]));
      console.log('Has stripe_subscription_id:', 'stripe_subscription_id' in memSample[0]);
      console.log('Has stripe_tier_id:', 'stripe_tier_id' in memSample[0]);
      console.log('Has customer_email:', 'customer_email' in memSample[0]);
      console.log('Has created_at:', 'created_at' in memSample[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkColumns();


