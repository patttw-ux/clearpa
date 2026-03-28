import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

/**
 * Browser Supabase client (anon key). Safe with RLS; use in Client Components only.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (!browserClient) {
    browserClient = createClient(url, anon);
  }
  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon);
}
