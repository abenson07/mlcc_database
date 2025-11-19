// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

// Create client after env vars are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  try {
    // Query memberships table structure by getting one row
    const { data: membershipSample, error: memError } = await supabase
      .from('memberships')
      .select('*')
      .limit(1);

    if (memError) {
      console.error('Error querying memberships:', memError);
    } else {
      console.log('\n=== MEMBERSHIPS TABLE COLUMNS ===');
      if (membershipSample && membershipSample.length > 0) {
        console.log('Columns:', Object.keys(membershipSample[0]));
        console.log('Sample row:', JSON.stringify(membershipSample[0], null, 2));
      } else {
        console.log('Table exists but is empty');
      }
    }

    // Query people table structure
    const { data: peopleSample, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .limit(1);

    if (peopleError) {
      console.error('Error querying people:', peopleError);
    } else {
      console.log('\n=== PEOPLE TABLE COLUMNS ===');
      if (peopleSample && peopleSample.length > 0) {
        console.log('Columns:', Object.keys(peopleSample[0]));
        console.log('Sample row:', JSON.stringify(peopleSample[0], null, 2));
      } else {
        console.log('Table exists but is empty');
      }
    }

    // Try to get enum values by querying distinct values
    const { data: statusValues } = await supabase
      .from('memberships')
      .select('status')
      .limit(1000);

    const { data: tierValues } = await supabase
      .from('memberships')
      .select('tier')
      .limit(1000);

    if (statusValues) {
      const uniqueStatuses = [...new Set(statusValues.map(r => r.status))];
      console.log('\n=== STATUS ENUM VALUES ===');
      console.log(uniqueStatuses);
    }

    if (tierValues) {
      const uniqueTiers = [...new Set(tierValues.map(r => r.tier))];
      console.log('\n=== TIER ENUM VALUES ===');
      console.log(uniqueTiers);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

inspectSchema();
