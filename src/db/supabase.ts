import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ConfigurationError } from "@/lib/errors";
import { env } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new ConfigurationError("Supabase service role credentials are not configured.");
  }

  if (!adminClient) {
    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
