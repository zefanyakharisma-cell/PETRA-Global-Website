import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { PreviewEditorLayer, type PreviewBlockInfo } from '@/components/admin/PreviewEditorLayer';
import { BLOCK_SIZE_DEFAULT } from '@/components/blocks/blockSize';
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
  searchParams: Promise<{ locale?: string; edit?: string }>;
}) {
  const { slug } = await params;
  const { locale: rawLocale = 'en', edit } = await searchParams;
  const editMode = edit === '1';
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

  const blockList = (blocks ?? []) as Block[];
  const info: PreviewBlockInfo[] = blockList.map((b) => ({
    id: b.id,
    type: b.type,
    size: (b.config.size as string) ?? BLOCK_SIZE_DEFAULT,
    locked: !!b.config.locked,
  }));

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <BlockRenderer blocks={blockList} locale={locale as Locale} mode={editMode ? 'edit' : 'public'} />
      {editMode && <PreviewEditorLayer blocks={info} />}
    </NextIntlClientProvider>
  );
}
