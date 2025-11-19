import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Client-side Supabase instance for use in React components and hooks.
 * Uses the anon key and respects Row Level Security (RLS) policies.
 * 
 * DO NOT use this in server-side code (getServerSideProps, API routes, etc.).
 * Use serverSupabase instead for server-side operations.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)


