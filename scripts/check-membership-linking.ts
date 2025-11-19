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

async function checkMembershipLinking() {
  try {
    console.log('📊 Checking membership linking status...\n');
    
    // Get all memberships
    const { data: allMemberships, error: memError } = await supabase
      .from('memberships')
      .select('id, customer_email, status, tier, stripe_subscription_id');
    
    if (memError) {
      throw memError;
    }
    
    console.log(`Total memberships in database: ${allMemberships?.length || 0}`);
    
    // Get all people with membership_id set
    const { data: peopleWithMemberships, error: peopleError } = await supabase
      .from('people')
      .select('id, email, membership_id')
      .not('membership_id', 'is', null);
    
    if (peopleError) {
      throw peopleError;
    }
    
    console.log(`People with membership_id set: ${peopleWithMemberships?.length || 0}`);
    
    // Get memberships that are linked (have a person with matching membership_id)
    const linkedMembershipIds = new Set(
      peopleWithMemberships?.map(p => p.membership_id) || []
    );
    
    const linkedMemberships = allMemberships?.filter(m => 
      linkedMembershipIds.has(m.id)
    ) || [];
    
    const unlinkedMemberships = allMemberships?.filter(m => 
      !linkedMembershipIds.has(m.id)
    ) || [];
    
    console.log(`\n=== LINKING STATUS ===`);
    console.log(`Linked memberships: ${linkedMemberships.length}`);
    console.log(`Unlinked memberships: ${unlinkedMemberships.length}`);
    
    // Check how many unlinked memberships have matching emails in people table
    const { data: allPeople, error: allPeopleError } = await supabase
      .from('people')
      .select('id, email');
    
    if (allPeopleError) {
      throw allPeopleError;
    }
    
    // Create email lookup map (normalize to lowercase)
    const emailToPersonId = new Map<string, string>();
    allPeople?.forEach(person => {
      if (person.email) {
        emailToPersonId.set(person.email.toLowerCase().trim(), person.id);
      }
    });
    
    // Check unlinked memberships that could be linked by email
    const unlinkedWithMatchingEmail = unlinkedMemberships.filter(m => {
      if (!m.customer_email) return false;
      const normalizedEmail = m.customer_email.toLowerCase().trim();
      return emailToPersonId.has(normalizedEmail);
    });
    
    const unlinkedWithoutMatchingEmail = unlinkedMemberships.filter(m => {
      if (!m.customer_email) return true;
      const normalizedEmail = m.customer_email.toLowerCase().trim();
      return !emailToPersonId.has(normalizedEmail);
    });
    
    console.log(`\n=== UNLINKED MEMBERSHIPS BREAKDOWN ===`);
    console.log(`Unlinked memberships with matching email in people table: ${unlinkedWithMatchingEmail.length}`);
    console.log(`Unlinked memberships WITHOUT matching email: ${unlinkedWithoutMatchingEmail.length}`);
    
    // Show status breakdown of unlinked memberships
    const statusCounts = new Map<string, number>();
    unlinkedMemberships.forEach(m => {
      const status = m.status || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });
    
    console.log(`\n=== UNLINKED MEMBERSHIPS BY STATUS ===`);
    Array.from(statusCounts.entries()).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Show active unlinked memberships
    const activeUnlinked = unlinkedMemberships.filter(m => 
      m.status?.toLowerCase() === 'active'
    );
    
    console.log(`\n=== ACTIVE UNLINKED MEMBERSHIPS ===`);
    console.log(`Total: ${activeUnlinked.length}`);
    
    if (activeUnlinked.length > 0 && activeUnlinked.length <= 20) {
      console.log('\nDetails:');
      activeUnlinked.forEach((m, i) => {
        const hasMatchingEmail = m.customer_email && 
          emailToPersonId.has(m.customer_email.toLowerCase().trim());
        console.log(`  ${i + 1}. ${m.customer_email || 'NO EMAIL'} - Status: ${m.status} - Tier: ${m.tier} - Can link: ${hasMatchingEmail ? 'YES' : 'NO'}`);
      });
    }
    
    // Summary
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total memberships: ${allMemberships?.length || 0}`);
    console.log(`Linked: ${linkedMemberships.length}`);
    console.log(`Unlinked: ${unlinkedMemberships.length}`);
    console.log(`Unlinked but can be linked by email: ${unlinkedWithMatchingEmail.length}`);
    console.log(`Unlinked and cannot be linked (no matching email): ${unlinkedWithoutMatchingEmail.length}`);
    
    // Expected members shown in frontend (active + linked)
    const activeLinked = linkedMemberships.filter(m => 
      m.status?.toLowerCase() === 'active'
    );
    console.log(`\nExpected members shown in frontend (active + linked): ${activeLinked.length}`);
    console.log(`Actual members shown in frontend: 185`);
    console.log(`Difference: ${activeLinked.length - 185}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMembershipLinking();

