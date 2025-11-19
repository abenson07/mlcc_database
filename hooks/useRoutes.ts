import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Route } from '@/data/routes';

export const useRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch routes with joined deliverer information from people table
      const { data, error: supabaseError } = await supabase
        .from('routes')
        .select(`
          *,
          deliverer:people!primary_deliverer_id(
            id,
            full_name,
            email,
            address
          )
        `);

      if (supabaseError) {
        console.error('Supabase error details:', supabaseError);
        throw supabaseError;
      }

      // Log first row to help debug column structure (only in development)
      if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
        console.log('Sample route row from Supabase:', data[0]);
        console.log('Available columns:', Object.keys(data[0]));
      }

      // Map Supabase data to Route type
      const validStatuses: Route['status'][] = ['Scheduled', 'In Progress', 'Completed', 'Open'];
      const validRouteTypes: Route['routeType'][] = ['Single family residence', 'Multi-family', 'Commercial', 'Mixed'];
      
      const getStatus = (value: any): Route['status'] => {
        const status = (value || 'Open').toString();
        return validStatuses.includes(status as Route['status']) 
          ? (status as Route['status']) 
          : 'Open';
      };

      const getRouteType = (value: any): Route['routeType'] | undefined => {
        if (!value) {
          return undefined;
        }
        const type = value.toString().trim();
        
        // Map database values to TypeScript type values
        const routeTypeMap: Record<string, Route['routeType']> = {
          'Single family residences': 'Single family residence',
          'Single family residence': 'Single family residence',
          'Apartments/Condos': 'Multi-family',
          'Multi-family': 'Multi-family',
          'Businesses': 'Commercial',
          'Commercial': 'Commercial',
          'Mixed': 'Mixed',
        };
        
        return routeTypeMap[type] || undefined;
      };

      const mappedRoutes: Route[] = (data || []).map((row: any) => {
        // Handle deliverer data (can be object, array, or null from join)
        const delivererData = row.deliverer 
          ? (Array.isArray(row.deliverer) ? row.deliverer[0] : row.deliverer)
          : null;

        return {
          id: row.id?.toString() || '',
          name: row.route_name || row.name || row.full_name || '',
          leaflets: typeof row.leaflet_count === 'number' ? row.leaflet_count :
                   typeof row.leaflets === 'number' ? row.leaflets :
                   parseInt(row.leaflet_count || row.leaflets || '0', 10),
          dropoffLocation: row.dropoff_location || row.dropoffLocation || row.drop_off_location || '',
          distributor: row.distributor || row.deliverer || null,
          status: getStatus(row.status),
          routeType: getRouteType(row.route_type || row.routeType || row.route_type_id),
          primary_deliverer_id: row.primary_deliverer_id || null,
          primary_deliverer_email: row.primary_deliverer_email || null,
          deliverer: delivererData ? {
            id: delivererData.id?.toString() || '',
            name: delivererData.full_name || delivererData.name || '',
            email: delivererData.email || '',
            address: delivererData.address || '',
          } : null,
        };
      });

      setRoutes(mappedRoutes);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return { routes, loading, error, refetch: fetchRoutes };
};

