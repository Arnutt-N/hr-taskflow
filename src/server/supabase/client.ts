import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

// TODO: replace with generated types via `supabase gen types typescript --local`
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

export const createServerSupabaseClient = (): SupabaseClient<Database> =>
  createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
