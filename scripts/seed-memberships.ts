// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

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

// Map CSV Product field to tier enum values
// Enum values are: "Household", "Individual", "Senior", "Student" (capitalized)
function parseMembershipTier(product: string): string | null {
  const productLower = product.toLowerCase();
  
  if (productLower.includes('business')) {
    return null; // Skip business memberships
  }
  
  if (productLower.includes('household')) {
    return 'Household';
  }
  
  if (productLower.includes('individual')) {
    return 'Individual';
  }
  
  if (productLower.includes('senior')) {
    return 'Senior';
  }
  
  if (productLower.includes('student')) {
    return 'Student';
  }
  
  return null;
}

// Extract date from timestamp string "2025-11-13 20:15" -> "2025-11-13"
function extractDate(timestamp: string): string {
  return timestamp.split(' ')[0];
}

interface CSVRow {
  id: string; // Stripe subscription ID
  'Customer ID': string;
  'Customer Email': string;
  'Product': string;
  'Product ID': string;
  'Status': string;
  'Created (UTC)': string;
  'Current Period Start (UTC)': string;
  'Customer Name': string;
}

async function seedMemberships() {
  try {
    console.log('Reading CSV file...');
    // CSV is in Downloads folder
    const csvPath = '/Users/alexbenson/Downloads/subscriptions.csv';
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    console.log('Parsing CSV...');
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Found ${records.length} rows in CSV`);
    
    // Filter out business memberships
    const validRecords = records.filter(row => {
      const tier = parseMembershipTier(row.Product);
      return tier !== null;
    });
    
    console.log(`After filtering business memberships: ${validRecords.length} rows`);
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    
    // Process in batches for better performance
    const batchSize = 50;
    
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (rows ${i + 1}-${Math.min(i + batchSize, validRecords.length)})...`);
      
      for (const row of batch) {
        try {
          const tier = parseMembershipTier(row.Product);
          if (!tier) continue;
          
          const customerEmail = row['Customer Email'].toLowerCase().trim();
          const customerName = row['Customer Name'].trim();
          
          // Find or create person
          let personId: string;
          
          const { data: existingPerson, error: findError } = await supabase
            .from('people')
            .select('id, full_name')
            .ilike('email', customerEmail)
            .limit(1)
            .single();
          
          if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Error finding person: ${findError.message}`);
          }
          
          if (existingPerson) {
            personId = existingPerson.id;
            // Update name if different
            if (existingPerson.full_name !== customerName) {
              const { error: updateError } = await supabase
                .from('people')
                .update({ full_name: customerName })
                .eq('id', personId);
              
              if (updateError) {
                console.warn(`Warning: Could not update name for ${customerEmail}: ${updateError.message}`);
              }
            }
          } else {
            // Create new person
            const { data: newPerson, error: createError } = await supabase
              .from('people')
              .insert({
                email: customerEmail,
                full_name: customerName,
                address: null,
                phone: null
              })
              .select('id')
              .single();
            
            if (createError) {
              throw new Error(`Error creating person: ${createError.message}`);
            }
            
            personId = newPerson.id;
            console.log(`Created new person: ${customerName} (${customerEmail})`);
          }
          
          // Create membership
          const membershipData = {
            stripe_customer_id: row['Customer ID'],
            stripe_subscription_id: row.id,
            stripe_tier_id: row['Product ID'],
            customer_email: customerEmail,
            is_subscription: true,
            payment_method: 'card',
            status: 'Active', // Enum value is "Active" (capitalized)
            tier: tier,
            last_renewal: extractDate(row['Current Period Start (UTC)']),
            created_at: row['Created (UTC)']
          };
          
          const { data: membership, error: membershipError } = await supabase
            .from('memberships')
            .insert(membershipData)
            .select('id')
            .single();
          
          if (membershipError) {
            // Check if it's a duplicate (unique constraint violation)
            if (membershipError.code === '23505') {
              console.log(`Membership already exists for subscription ${row.id}, skipping...`);
              continue;
            }
            // Check if it's an enum value error
            if (membershipError.message.includes('invalid input value for enum') || membershipError.message.includes('enum')) {
              console.error(`Enum value error for ${customerEmail}. Tier: "${tier}", Status: "Active"`);
              console.error(`Full error: ${membershipError.message}`);
              console.error(`Valid enum values: Status=["Active","Expired","Donation","Cancelled"], Tier=["Household","Individual","Senior","Student"]`);
            }
            throw new Error(`Error creating membership: ${membershipError.message}`);
          }
          
          // Link membership to person
          const { error: linkError } = await supabase
            .from('people')
            .update({ membership_id: membership.id })
            .eq('id', personId);
          
          if (linkError) {
            throw new Error(`Error linking membership to person: ${linkError.message}`);
          }
          
          created++;
          
        } catch (error) {
          errors++;
          const errorMsg = `Error processing row ${i + batch.indexOf(row) + 1} (${row['Customer Email']}): ${error instanceof Error ? error.message : String(error)}`;
          errorDetails.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Total rows processed: ${validRecords.length}`);
    console.log(`Memberships created: ${created}`);
    console.log(`People updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    
    if (errorDetails.length > 0) {
      console.log('\n=== Errors ===');
      errorDetails.forEach(err => console.log(err));
    }
    
    console.log('\nImport complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

seedMemberships();

