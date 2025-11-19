
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Person, DuplicateMembership } from '@/data/people';

export const usePeople = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [duplicateMemberships, setDuplicateMemberships] = useState<DuplicateMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('people')
        .select(`
          *,
          memberships (
            id,
            tier,
            status,
            last_renewal
          )
        `);

      if (supabaseError) {
        console.error('Supabase error details:', supabaseError);
        throw supabaseError;
      }

      // Log first row to help debug column structure (only in development)
      if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
        console.log('Sample row from Supabase:', data[0]);
        console.log('Available columns:', Object.keys(data[0]));
      }

      // Map Supabase data to Person type - only include columns that exist in Supabase
      const mappedPeople: Person[] = (data || []).map((row: any) => {
        // Use full_name as the primary column (matching Supabase schema)
        const name = row.full_name || row.name || '';
        
        // Handle membership data (can be object, array, or null from join)
        const membership = row.memberships 
          ? (Array.isArray(row.memberships) ? row.memberships[0] : row.memberships)
          : null;
        
        return {
          id: row.id?.toString() || '',
          name: name,
          email: row.email || '',
          address: row.address || '',
          householdId: row.household_id?.toString() || undefined,
          membershipId: row.membership_id?.toString() || membership?.id?.toString() || undefined,
          membershipTier: membership?.tier || undefined,
          membershipStatus: membership?.status || undefined,
          lastRenewal: membership?.last_renewal || undefined,
        };
      });

      setPeople(mappedPeople);
    } catch (err) {
      console.error('Error fetching people:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch people');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDuplicateMemberships = useCallback(async () => {
    try {
      // Get all memberships (not just active, to catch all duplicates)
      const { data: allMemberships, error: memError } = await supabase
        .from('memberships')
        .select('id, customer_email, status, tier, last_renewal, stripe_subscription_id, stripe_customer_id')
        .not('customer_email', 'is', null);

      if (memError) {
        console.error('Error fetching memberships:', memError);
        return;
      }

      // Get all people for email matching
      const { data: allPeople } = await supabase
        .from('people')
        .select('id, full_name, email');

      // Create a map of email to person name
      const emailToPersonMap = new Map<string, string>();
      allPeople?.forEach(person => {
        if (person.email) {
          emailToPersonMap.set(person.email.toLowerCase().trim(), person.full_name || '');
        }
      });

      // Group by email (normalized to lowercase)
      const emailGroups = new Map<string, typeof allMemberships>();
      allMemberships?.forEach(membership => {
        if (!membership.customer_email) return;
        const normalizedEmail = membership.customer_email.toLowerCase().trim();
        if (!emailGroups.has(normalizedEmail)) {
          emailGroups.set(normalizedEmail, []);
        }
        emailGroups.get(normalizedEmail)!.push(membership);
      });

      // Find duplicates (emails with more than one membership)
      const duplicates: DuplicateMembership[] = [];
      
      for (const [email, memberships] of emailGroups.entries()) {
        if (memberships.length > 1) {
          // Include ALL memberships as separate TierInfo objects (don't group by tier)
          // Sort by renewal date (most recent first)
          const tiers: { tier: string; lastRenewal?: string; stripeSubscriptionId?: string; stripeCustomerId?: string }[] = memberships
            .filter(m => m.tier) // Only include memberships with a tier
            .map(m => ({
              tier: m.tier!,
              lastRenewal: m.last_renewal || undefined,
              stripeSubscriptionId: m.stripe_subscription_id || undefined,
              stripeCustomerId: m.stripe_customer_id || undefined
            }))
            .sort((a, b) => {
              // Sort by renewal date descending (most recent first)
              // If no renewal date, put at the end
              if (!a.lastRenewal && !b.lastRenewal) return 0;
              if (!a.lastRenewal) return 1;
              if (!b.lastRenewal) return -1;
              return b.lastRenewal.localeCompare(a.lastRenewal);
            });

          duplicates.push({
            email: email,
            personName: emailToPersonMap.get(email) || undefined,
            membershipCount: memberships.length,
            tiers: tiers,
          });
        }
      }

      setDuplicateMemberships(duplicates);
    } catch (err) {
      console.error('Error fetching duplicate memberships:', err);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
    fetchDuplicateMemberships();
  }, [fetchPeople, fetchDuplicateMemberships]);

  return { 
    people, 
    duplicateMemberships,
    loading, 
    error, 
    refetch: () => {
      fetchPeople();
      fetchDuplicateMemberships();
    }
  };
};

