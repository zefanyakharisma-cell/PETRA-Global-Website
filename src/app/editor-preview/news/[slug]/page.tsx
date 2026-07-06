import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { routing } from '@/i18n/routing';
import type { Block, Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Draft-aware live preview for a news article, rendered inside the editor's
 * iframe. Mirrors the public /news/[slug] layout (header + blocks) from current
 * (possibly draft) state. Guarded by middleware like /admin.
 */
export default async function NewsEditorPreview({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale: rawLocale = 'en' } = await searchParams;
  const locale = routing.locales.includes(rawLocale as never)
    ? rawLocale
    : routing.defaultLocale;

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  const supabase = await createClient();
  const { data: article } = await supabase.from('news').select('*').eq('slug', slug).maybeSingle();
  if (!article) notFound();

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('news_id', article.id)
    .order('position');

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <BlockRenderer blocks={(blocks ?? []) as Block[]} locale={locale as Locale} mode="public" />
    </NextIntlClientProvider>
  );
}
