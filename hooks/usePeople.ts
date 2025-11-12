import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Person } from '@/data/people';

export const usePeople = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('people')
          .select('*');

        if (supabaseError) {
          console.error('Supabase error details:', supabaseError);
          throw supabaseError;
        }

        // Log first row to help debug column structure (only in development)
        if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
          console.log('Sample row from Supabase:', data[0]);
          console.log('Available columns:', Object.keys(data[0]));
        }

        // Map Supabase data to Person type
        const validMembershipTypes: Person['membershipType'][] = ['Resident', 'Member', 'Volunteer', 'Partner'];
        const getMembershipType = (value: any): Person['membershipType'] => {
          const type = (value || 'Resident').toString();
          return validMembershipTypes.includes(type as Person['membershipType']) 
            ? (type as Person['membershipType']) 
            : 'Resident';
        };

        const mappedPeople: Person[] = (data || []).map((row: any) => {
          // Handle different name column possibilities
          const name = row.name 
            || (row.first_name && row.last_name ? `${row.first_name} ${row.last_name}`.trim() : '')
            || row.first_name 
            || row.full_name
            || '';
          
          // Handle different address column possibilities
          const address = row.address 
            || row.street_address
            || (row.street && row.city && row.state 
              ? `${row.street}, ${row.city}, ${row.state}`.trim() 
              : '')
            || '';

          return {
            id: row.id?.toString() || '',
            name: name,
            email: row.email || '',
            address: address,
            membershipType: getMembershipType(row.membership_type || row.membershipType),
            volunteerInterests: Array.isArray(row.volunteer_interests) 
              ? row.volunteer_interests 
              : Array.isArray(row.volunteerInterests)
              ? row.volunteerInterests
              : typeof row.volunteer_interests === 'string'
              ? row.volunteer_interests.split(',').map((s: string) => s.trim()).filter(Boolean)
              : typeof row.volunteerInterests === 'string'
              ? row.volunteerInterests.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
            isMember: row.is_member ?? row.isMember ?? false,
            householdId: row.household_id?.toString() || row.householdId || undefined,
          };
        });

        setPeople(mappedPeople);
      } catch (err) {
        console.error('Error fetching people:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch people');
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, []);

  return { people, loading, error };
};

