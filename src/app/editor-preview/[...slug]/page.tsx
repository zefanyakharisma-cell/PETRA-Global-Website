import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { PreviewEditorLayer, type PreviewBlockInfo } from '@/components/admin/PreviewEditorLayer';
import { routing } from '@/i18n/routing';
import { BLOCK_SIZE_DEFAULT } from '@/components/blocks/blockSize';
import type { Block, Locale, PageRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Draft-aware live preview rendered inside the editor's iframe. Renders the
 * REAL server block components from current (possibly draft) state. Guarded by
 * middleware (treated like /admin) so only authed admins can view drafts.
 */
export default async function EditorPreview({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ locale?: string; edit?: string }>;
}) {
  const { slug } = await params;
  const path = slug.join('/');
  const { locale: rawLocale = 'en', edit } = await searchParams;
  const editMode = edit === '1';
  const locale = routing.locales.includes(rawLocale as never)
    ? rawLocale
    : routing.defaultLocale;

  // This route lives outside the `[locale]` segment, so next-intl can't infer
  // the locale from the URL. Set it explicitly so blocks using next-intl
  // navigation (e.g. the i18n `<Link>`) have a valid context inside the iframe.
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  const supabase = await createClient();
  const { data: page } = await supabase.from('pages').select('*').eq('slug', path).maybeSingle();
  if (!page) notFound();

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
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
      <BlockRenderer
        blocks={blockList}
        locale={locale as Locale}
        mode={editMode ? 'edit' : 'public'}
        pageOwnerStaffId={(page as PageRecord).owner_staff_id}
      />
      {editMode && <PreviewEditorLayer blocks={info} />}
    </NextIntlClientProvider>
  );
}
