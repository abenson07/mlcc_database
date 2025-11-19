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
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

function parseMembershipTier(product: string): string | null {
  const productLower = product.toLowerCase();
  if (productLower.includes('business')) {
    return null;
  }
  if (productLower.includes('household')) return 'Household';
  if (productLower.includes('individual')) return 'Individual';
  if (productLower.includes('senior')) return 'Senior';
  if (productLower.includes('student')) return 'Student';
  return null;
}

async function compareCSVAndImport() {
  try {
    console.log('📊 Comparing CSV with imported memberships...\n');
    
    // Read CSV
    const csvPath = '/Users/alexbenson/Downloads/subscriptions.csv';
    const csvContent = readFileSync(csvPath, 'utf-8');
    const csvRows: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Total CSV rows: ${csvRows.length}`);
    
    // Filter business memberships
    const businessMemberships = csvRows.filter(row => {
      const tier = parseMembershipTier(row.Product);
      return tier === null;
    });
    
    console.log(`Business memberships in CSV: ${businessMemberships.length}`);
    console.log('\nBusiness membership rows:');
    businessMemberships.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row['Customer Name']} (${row['Customer Email']}) - ${row.id}`);
    });
    
    // Get all imported memberships
    const { data: importedMemberships, error } = await supabase
      .from('memberships')
      .select('stripe_subscription_id, customer_email, tier, status');
    
    if (error) {
      throw error;
    }
    
    console.log(`\nImported memberships: ${importedMemberships?.length || 0}`);
    
    // Create sets for comparison
    const csvSubscriptionIds = new Set(
      csvRows
        .filter(row => parseMembershipTier(row.Product) !== null)
        .map(row => row.id)
    );
    
    const importedSubscriptionIds = new Set(
      importedMemberships?.map(m => m.stripe_subscription_id) || []
    );
    
    // Find missing imports
    const missingFromImport = Array.from(csvSubscriptionIds).filter(
      id => !importedSubscriptionIds.has(id)
    );
    
    // Find unexpected imports
    const unexpectedImports = Array.from(importedSubscriptionIds).filter(
      id => !csvSubscriptionIds.has(id)
    );
    
    console.log('\n=== ANALYSIS ===');
    console.log(`Expected non-business rows: ${csvRows.length - businessMemberships.length}`);
    console.log(`Actually imported: ${importedMemberships?.length || 0}`);
    console.log(`Missing from import: ${missingFromImport.length}`);
    
    if (missingFromImport.length > 0) {
      console.log('\n❌ Rows in CSV but NOT imported:');
      missingFromImport.forEach(subId => {
        const row = csvRows.find(r => r.id === subId);
        if (row) {
          console.log(`\n  Subscription ID: ${subId}`);
          console.log(`  Customer: ${row['Customer Name']} (${row['Customer Email']})`);
          console.log(`  Product: ${row.Product}`);
          console.log(`  Would be tier: ${parseMembershipTier(row.Product) || 'BUSINESS (should be skipped)'}`);
          console.log(`  Created: ${row['Created (UTC)']}`);
        }
      });
    }
    
    if (unexpectedImports.length > 0) {
      console.log('\n⚠️  Rows imported but NOT in CSV:');
      unexpectedImports.forEach(subId => {
        const mem = importedMemberships?.find(m => m.stripe_subscription_id === subId);
        if (mem) {
          console.log(`  - ${mem.customer_email} - ${subId}`);
        }
      });
    }
    
    // Check for duplicates in CSV
    const subscriptionIdCounts = new Map<string, number>();
    csvRows.forEach(row => {
      subscriptionIdCounts.set(row.id, (subscriptionIdCounts.get(row.id) || 0) + 1);
    });
    
    const duplicates = Array.from(subscriptionIdCounts.entries())
      .filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Duplicate subscription IDs in CSV:');
      duplicates.forEach(([subId, count]) => {
        console.log(`  - ${subId}: appears ${count} times`);
        const rows = csvRows.filter(r => r.id === subId);
        rows.forEach(r => {
          console.log(`    - ${r['Customer Name']} - ${r.Product}`);
        });
      });
    }
    
    console.log('\n✅ Comparison complete!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

compareCSVAndImport();


