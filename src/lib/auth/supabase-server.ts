import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { AppError, ConfigurationError } from "@/lib/errors";
import { env } from "@/lib/env";

export async function createSupabaseServerAuthClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new ConfigurationError("Supabase Auth environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Route handlers can set cookies; server components cannot. Auth middleware covers refresh.
        }
      },
    },
  });
}

export async function requireStaffSession() {
  if (!env.REQUIRE_STAFF_AUTH) return null;

  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
  }

  return user;
}
