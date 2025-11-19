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

async function linkMembershipsByEmailSmart() {
  try {
    console.log('🔗 Smart linking: Linking best membership to people by email...\n');
    
    // Get all memberships with full details
    const { data: allMemberships, error: memError } = await supabase
      .from('memberships')
      .select('id, customer_email, status, tier, last_renewal, created_at')
      .order('last_renewal', { ascending: false, nullsFirst: false });
    
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
    
    // Group memberships by email
    const membershipsByEmail = new Map<string, typeof allMemberships>();
    allMemberships?.forEach(membership => {
      if (!membership.customer_email) return;
      const normalizedEmail = membership.customer_email.toLowerCase().trim();
      if (!membershipsByEmail.has(normalizedEmail)) {
        membershipsByEmail.set(normalizedEmail, []);
      }
      membershipsByEmail.get(normalizedEmail)!.push(membership);
    });
    
    console.log(`Total memberships: ${allMemberships?.length || 0}`);
    console.log(`Unique emails with memberships: ${membershipsByEmail.size}\n`);
    
    let linked = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    
    // Process each email
    for (const [email, memberships] of membershipsByEmail.entries()) {
      const personId = emailToPersonId.get(email);
      
      if (!personId) {
        skipped++;
        continue;
      }
      
      // Find the person's current membership
      const person = allPeople?.find(p => p.id === personId);
      const currentMembershipId = person?.membership_id;
      
      // Find the best membership to link (prioritize Active status, then most recent)
      const activeMemberships = memberships.filter(m => 
        m.status?.toLowerCase() === 'active'
      );
      
      // If there are active memberships, use the most recent one
      // Otherwise, use the most recent membership overall
      const bestMembership = activeMemberships.length > 0
        ? activeMemberships[0] // Already sorted by last_renewal desc
        : memberships[0]; // Most recent overall
      
      // If person already has the best membership linked, skip
      if (currentMembershipId === bestMembership.id) {
        skipped++;
        continue;
      }
      
      // If person has a different membership, update it
      if (currentMembershipId && currentMembershipId !== bestMembership.id) {
        // Check if current membership is active
        const currentMembership = allMemberships?.find(m => m.id === currentMembershipId);
        const currentIsActive = currentMembership?.status?.toLowerCase() === 'active';
        const bestIsActive = bestMembership.status?.toLowerCase() === 'active';
        
        // Only update if:
        // 1. Current is not active AND best is active, OR
        // 2. Both are active but best is more recent
        if ((!currentIsActive && bestIsActive) || 
            (currentIsActive && bestIsActive && 
             bestMembership.last_renewal && currentMembership?.last_renewal &&
             new Date(bestMembership.last_renewal) > new Date(currentMembership.last_renewal))) {
          try {
            const { error: updateError } = await supabase
              .from('people')
              .update({ membership_id: bestMembership.id })
              .eq('id', personId);
            
            if (updateError) {
              throw updateError;
            }
            
            updated++;
            console.log(`🔄 Updated ${email}: ${currentMembershipId} → ${bestMembership.id} (${bestMembership.status}, renewed: ${bestMembership.last_renewal})`);
          } catch (error) {
            errors++;
            const errorMsg = `Error updating membership for ${email}: ${error instanceof Error ? error.message : String(error)}`;
            errorDetails.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        } else {
          skipped++;
        }
      } else {
        // Person has no membership, link the best one
        try {
          const { error: updateError } = await supabase
            .from('people')
            .update({ membership_id: bestMembership.id })
            .eq('id', personId);
          
          if (updateError) {
            throw updateError;
          }
          
          linked++;
          console.log(`✅ Linked ${email} to membership ${bestMembership.id} (${bestMembership.status}, renewed: ${bestMembership.last_renewal})`);
        } catch (error) {
          errors++;
          const errorMsg = `Error linking membership for ${email}: ${error instanceof Error ? error.message : String(error)}`;
          errorDetails.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Newly linked: ${linked}`);
    console.log(`Updated to better membership: ${updated}`);
    console.log(`Skipped (already optimal): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    if (errorDetails.length > 0) {
      console.log(`\n=== ERRORS ===`);
      errorDetails.forEach(err => console.log(err));
    }
    
    console.log('\n✅ Smart linking complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

linkMembershipsByEmailSmart();

