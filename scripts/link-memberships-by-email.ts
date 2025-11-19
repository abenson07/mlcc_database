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

async function linkMembershipsByEmail() {
  try {
    console.log('🔗 Linking unlinked memberships to people by email...\n');
    
    // Get all memberships
    const { data: allMemberships, error: memError } = await supabase
      .from('memberships')
      .select('id, customer_email, status, tier');
    
    if (memError) {
      throw memError;
    }
    
    // Get all people
    const { data: allPeople, error: peopleError } = await supabase
      .from('people')
      .select('id, email, membership_id');
    
    if (peopleError) {
      throw peopleError;
    }
    
    // Create email lookup map (normalize to lowercase)
    const emailToPersonId = new Map<string, string>();
    allPeople?.forEach(person => {
      if (person.email) {
        emailToPersonId.set(person.email.toLowerCase().trim(), person.id);
      }
    });
    
    // Find unlinked memberships
    const peopleWithMembershipIds = new Set(
      allPeople?.filter(p => p.membership_id).map(p => p.membership_id) || []
    );
    
    const unlinkedMemberships = allMemberships?.filter(m => 
      !peopleWithMembershipIds.has(m.id)
    ) || [];
    
    console.log(`Total memberships: ${allMemberships?.length || 0}`);
    console.log(`Unlinked memberships: ${unlinkedMemberships.length}\n`);
    
    let linked = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    
    // Process each unlinked membership
    for (const membership of unlinkedMemberships) {
      if (!membership.customer_email) {
        skipped++;
        continue;
      }
      
      const normalizedEmail = membership.customer_email.toLowerCase().trim();
      const personId = emailToPersonId.get(normalizedEmail);
      
      if (!personId) {
        skipped++;
        continue;
      }
      
      // Check if person already has a membership_id
      const person = allPeople?.find(p => p.id === personId);
      if (person?.membership_id) {
        console.log(`⚠️  Person ${person.email} already has membership_id ${person.membership_id}, skipping membership ${membership.id}`);
        skipped++;
        continue;
      }
      
      // Link membership to person
      try {
        const { error: updateError } = await supabase
          .from('people')
          .update({ membership_id: membership.id })
          .eq('id', personId);
        
        if (updateError) {
          throw updateError;
        }
        
        linked++;
        console.log(`✅ Linked membership ${membership.id} (${membership.customer_email}) to person ${personId}`);
      } catch (error) {
        errors++;
        const errorMsg = `Error linking membership ${membership.id} (${membership.customer_email}): ${error instanceof Error ? error.message : String(error)}`;
        errorDetails.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Linked: ${linked}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    if (errorDetails.length > 0) {
      console.log(`\n=== ERRORS ===`);
      errorDetails.forEach(err => console.log(err));
    }
    
    console.log('\n✅ Linking complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

linkMembershipsByEmail();

