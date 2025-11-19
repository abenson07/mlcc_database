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

async function checkSchema() {
  try {
    // Query information_schema to get column names
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'memberships'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      // Try alternative: attempt to insert null to see what columns are required
      const { error: insertError } = await supabase
        .from('memberships')
        .insert({});
      
      console.log('Insert error (shows required columns):', insertError);
    } else {
      console.log('Memberships columns:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();


