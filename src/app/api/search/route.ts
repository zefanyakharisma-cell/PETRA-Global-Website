import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { t as localize, type Locale, type LocaleMap } from '@/lib/types';

/**
 * Lightweight site search across published pages, programs, and news.
 * Matches on the localized title (JSONB ->> locale, case-insensitive).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const locale = (searchParams.get('locale') ?? 'en') as Locale;
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const like = `%${q}%`;

  const [pages, programs, news] = await Promise.all([
    supabase
      .from('pages')
      .select('slug,title')
      .eq('status', 'published')
      .or(`title->>en.ilike.${like},title->>id.ilike.${like}`)
      .limit(5),
    supabase
      .from('programs')
      .select('slug,title')
      .or(`title->>en.ilike.${like},title->>id.ilike.${like}`)
      .limit(5),
    supabase
      .from('news')
      .select('slug,title')
      .not('published_at', 'is', null)
      .or(`title->>en.ilike.${like},title->>id.ilike.${like}`)
      .limit(5),
  ]);

  const results = [
    ...(pages.data ?? []).map((r) => ({ type: 'page' as const, slug: r.slug, title: localize(r.title as LocaleMap, locale) })),
    ...(programs.data ?? []).map((r) => ({ type: 'program' as const, slug: r.slug, title: localize(r.title as LocaleMap, locale) })),
    ...(news.data ?? []).map((r) => ({ type: 'news' as const, slug: r.slug, title: localize(r.title as LocaleMap, locale) })),
  ];

  return NextResponse.json({ results });
}
