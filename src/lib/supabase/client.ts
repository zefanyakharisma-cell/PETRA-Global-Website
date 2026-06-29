import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Browser client. Scoped to the isolated `petra_io` schema — the Supabase
 * project is SHARED with another brand, so no PETRA table ever lives in `public`.
 */
export function createClient() {
  return createBrowserClient<Database, 'petra_io'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'petra_io' } },
  );
}
