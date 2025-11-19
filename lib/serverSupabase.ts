import { createClient } from '@supabase/supabase-js'

// Prevent this from being imported in browser/client code
if (typeof window !== 'undefined') {
  throw new Error(
    'serverSupabase cannot be imported in client-side code. ' +
    'Use supabaseClient instead for browser/client operations.'
  )
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase server environment variables')
}

/**
 * Server-side Supabase instance for use in API routes and getServerSideProps.
 * Uses the service role key and bypasses Row Level Security (RLS).
 * 
 * ⚠️ SECURITY WARNING: This client has full database access.
 * - NEVER import this in client-side code
 * - ONLY use in server-side contexts (API routes, getServerSideProps, etc.)
 * - Always validate user permissions before performing operations
 */
export const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})


