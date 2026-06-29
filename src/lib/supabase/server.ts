import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Server client (RSC / route handlers / server actions). Reads the user's
 * auth cookies so RLS applies the correct role. Pinned to `petra_io` schema.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, 'petra_io'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'petra_io' },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session instead.
          }
        },
      },
    },
  );
}

/**
 * Privileged client using the service-role key. SERVER ONLY. Bypasses RLS —
 * use only in trusted server actions (e.g. routing an inquiry notification,
 * the optional seed script). Never import this into client code.
 */
export function createAdminClient() {
  return createServerClient<Database, 'petra_io'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'petra_io' },
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
