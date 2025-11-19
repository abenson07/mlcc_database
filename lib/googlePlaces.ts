/**
 * Google Places API Service
 * 
 * Free tier includes:
 * - $200 free credit per month
 * - Text Search: $32 per 1,000 requests
 * - Place Details: $17 per 1,000 requests
 * - Autocomplete: $2.83 per 1,000 requests
 * 
 * Setup:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable "Places API" and "Places API (New)"
 * 4. Go to "Credentials" and create an API key
 * 5. Restrict the API key to "Places API" only
 * 6. Add your domain to HTTP referrer restrictions (for web)
 * 7. Add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your .env.local file
 */

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
}

export interface PlaceDetails extends GooglePlace {
  international_phone_number?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

/**
 * Search for businesses using Google Places Text Search
 * This is the most flexible search method and works well for finding businesses by name or category
 * 
 * @param query - Search query (e.g., "restaurants in Toronto", "coffee shops near me")
 * @param location - Optional location bias (e.g., "43.6532,-79.3832" for Toronto)
 * @param radius - Optional radius in meters (max 50000)
 * @returns Array of matching places
 */
export async function searchPlaces(
  query: string,
  location?: string,
  radius?: number
): Promise<GooglePlace[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Places API key is not configured. Please add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your .env.local file');
  }

  const params = new URLSearchParams({
    query,
    key: apiKey,
    fields: 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,business_status',
  });

  // Add location bias if provided
  if (location) {
    params.append('location', location);
  }

  // Add radius if provided
  if (radius) {
    params.append('radius', radius.toString());
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      throw new Error('Google Places API request denied. Check your API key and restrictions.');
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API quota exceeded. Check your usage limits.');
    }

    if (data.status === 'ZERO_RESULTS') {
      return [];
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    return data.results || [];
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific place using Place ID
 * 
 * @param placeId - The Place ID from a search result
 * @returns Detailed place information
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,types,geometry,business_status,opening_hours,photos,reviews',
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      throw new Error('Google Places API request denied. Check your API key and restrictions.');
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API quota exceeded.');
    }

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    return data.result || null;
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
}

/**
 * Autocomplete search suggestions (more cost-effective for search-as-you-type)
 * Note: This requires loading the Google Maps JavaScript API
 * For a simpler server-side approach, use searchPlaces with debouncing
 */
export async function autocompletePlaces(
  input: string,
  location?: string,
  radius?: number
): Promise<GooglePlace[]> {
  // For autocomplete, you can use the same searchPlaces function with debouncing
  // Or implement the Autocomplete API which requires the Maps JavaScript API
  // For now, we'll use a simple text search with a minimum query length
  if (input.length < 3) {
    return [];
  }

  return searchPlaces(input, location, radius);
}



