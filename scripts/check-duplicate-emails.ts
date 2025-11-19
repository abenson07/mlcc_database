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

async function checkDuplicateEmails() {
  try {
    console.log('📊 Checking for duplicate customer_email entries in memberships table...\n');
    
    // Get all memberships
    const { data: allMemberships, error: memError } = await supabase
      .from('memberships')
      .select('id, customer_email, status, tier, last_renewal, stripe_subscription_id');
    
    if (memError) {
      throw memError;
    }
    
    console.log(`Total memberships: ${allMemberships?.length || 0}`);
    
    // Count emails (normalize to lowercase)
    const emailCounts = new Map<string, typeof allMemberships>();
    allMemberships?.forEach(membership => {
      if (!membership.customer_email) return;
      const normalizedEmail = membership.customer_email.toLowerCase().trim();
      if (!emailCounts.has(normalizedEmail)) {
        emailCounts.set(normalizedEmail, []);
      }
      emailCounts.get(normalizedEmail)!.push(membership);
    });
    
    // Find duplicates
    const duplicateEmails = Array.from(emailCounts.entries())
      .filter(([_, memberships]) => memberships.length > 1)
      .sort((a, b) => b[1].length - a[1].length); // Sort by count descending
    
    console.log(`\n=== DUPLICATE EMAIL ANALYSIS ===`);
    console.log(`Unique customer emails: ${emailCounts.size}`);
    console.log(`Emails with duplicates: ${duplicateEmails.length}`);
    
    // Count total memberships that are duplicates
    const totalDuplicateMemberships = duplicateEmails.reduce((sum, [_, memberships]) => {
      return sum + memberships.length;
    }, 0);
    
    const uniqueMemberships = allMemberships?.length || 0 - totalDuplicateMemberships + duplicateEmails.length;
    
    console.log(`\nTotal memberships with duplicate emails: ${totalDuplicateMemberships}`);
    console.log(`Unique memberships (if deduplicated): ${uniqueMemberships}`);
    
    // Show breakdown
    console.log(`\n=== BREAKDOWN ===`);
    const duplicateCounts = new Map<number, number>();
    duplicateEmails.forEach(([_, memberships]) => {
      const count = memberships.length;
      duplicateCounts.set(count, (duplicateCounts.get(count) || 0) + 1);
    });
    
    console.log(`Emails with 2 memberships: ${duplicateCounts.get(2) || 0}`);
    console.log(`Emails with 3 memberships: ${duplicateCounts.get(3) || 0}`);
    console.log(`Emails with 4+ memberships: ${Array.from(duplicateCounts.entries())
      .filter(([count]) => count >= 4)
      .reduce((sum, [count, emails]) => sum + emails, 0)}`);
    
    // Show details of duplicates
    if (duplicateEmails.length > 0) {
      console.log(`\n=== DUPLICATE EMAIL DETAILS ===`);
      duplicateEmails.forEach(([email, memberships], index) => {
        console.log(`\n${index + 1}. ${email} (${memberships.length} memberships):`);
        memberships.forEach((m, i) => {
          console.log(`   ${i + 1}. ID: ${m.id}`);
          console.log(`      Status: ${m.status}`);
          console.log(`      Tier: ${m.tier}`);
          console.log(`      Last Renewal: ${m.last_renewal || 'N/A'}`);
          console.log(`      Subscription ID: ${m.stripe_subscription_id}`);
        });
      });
    }
    
    // Check how many of these duplicates are active
    const activeDuplicates = duplicateEmails.map(([email, memberships]) => {
      const active = memberships.filter(m => m.status?.toLowerCase() === 'active');
      return { email, total: memberships.length, active: active.length, memberships: active };
    }).filter(d => d.active > 0);
    
    console.log(`\n=== ACTIVE DUPLICATES ===`);
    console.log(`Emails with multiple active memberships: ${activeDuplicates.length}`);
    activeDuplicates.forEach(({ email, total, active, memberships }) => {
      console.log(`\n${email}: ${active} active out of ${total} total`);
      memberships.forEach((m, i) => {
        console.log(`   Active ${i + 1}: ${m.tier} - Renewed: ${m.last_renewal || 'N/A'}`);
      });
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total memberships: ${allMemberships?.length || 0}`);
    console.log(`Unique customer emails: ${emailCounts.size}`);
    console.log(`Emails with duplicates: ${duplicateEmails.length}`);
    console.log(`Total duplicate memberships: ${totalDuplicateMemberships}`);
    console.log(`Emails with multiple active memberships: ${activeDuplicates.length}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDuplicateEmails();

