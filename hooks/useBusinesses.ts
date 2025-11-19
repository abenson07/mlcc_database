import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Business, BusinessStatus, SponsorshipLevel } from '@/data/businesses';

export const useBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('businesses')
        .select('*');

      if (supabaseError) {
        console.error('Supabase error details:', supabaseError);
        throw supabaseError;
      }

      // Log first row to help debug column structure (only in development)
      if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
        console.log('Sample business row from Supabase:', data[0]);
        console.log('Available columns:', Object.keys(data[0]));
      }

      // Map Supabase data to Business type
      const validStatuses: BusinessStatus[] = ['activeMember', 'pastSponsor', 'yetToSupport'];
      const validSponsorshipLevels: SponsorshipLevel[] = ['Gold', 'Silver', 'Bronze', 'In-Kind'];
      
      const getStatus = (value: any): BusinessStatus => {
        const status = (value || 'yetToSupport').toString();
        return validStatuses.includes(status as BusinessStatus) 
          ? (status as BusinessStatus) 
          : 'yetToSupport';
      };

      const getSponsorshipTags = (value: any): SponsorshipLevel[] => {
        if (Array.isArray(value)) {
          return value.filter((tag: string) => 
            validSponsorshipLevels.includes(tag as SponsorshipLevel)
          ) as SponsorshipLevel[];
        }
        if (typeof value === 'string') {
          return value.split(',')
            .map((s: string) => s.trim())
            .filter((tag: string) => validSponsorshipLevels.includes(tag as SponsorshipLevel)) as SponsorshipLevel[];
        }
        return [];
      };

      const getLinkedEvents = (value: any): string[] => {
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === 'string') {
          return value.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        return [];
      };

      const mappedBusinesses: Business[] = (data || []).map((row: any) => ({
        id: row.id?.toString() || '',
        companyName: row.name || row.company_name || row.companyName || '',
        contactName: row.contact_name || row.contactName || '',
        email: row.email || '',
        phone: row.phone || '',
        sponsorshipTags: getSponsorshipTags(row.sponsorship_tags || row.sponsorshipTags),
        linkedEvents: getLinkedEvents(row.linked_events || row.linkedEvents),
        address: row.address || '',
        notes: row.notes || '',
        status: getStatus(row.status),
      }));

      setBusinesses(mappedBusinesses);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  return { businesses, loading, error, refetch: fetchBusinesses };
};

