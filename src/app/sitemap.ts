import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Generated sitemap covering both locales for every published route. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [pages, programs, news] = await Promise.all([
    supabase.from('pages').select('slug').eq('status', 'published'),
    supabase.from('programs').select('slug'),
    supabase.from('news').select('slug').not('published_at', 'is', null),
  ]);

  const paths = [
    '',
    ...(pages.data ?? []).map((p) => `/${p.slug}`),
    ...(programs.data ?? []).map((p) => `/programs/${p.slug}`),
    ...(news.data ?? []).map((n) => `/news/${n.slug}`),
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    entries.push({
      url: `${BASE}/${routing.defaultLocale}${path}`,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${BASE}/${l}${path}`]),
        ),
      },
    });
  }
  return entries;
}
