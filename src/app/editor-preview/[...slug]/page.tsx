import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { routing } from '@/i18n/routing';
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
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const path = slug.join('/');
  const { locale: rawLocale = 'en' } = await searchParams;
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <BlockRenderer
        blocks={(blocks ?? []) as Block[]}
        locale={locale as Locale}
        mode="public"
        pageOwnerStaffId={(page as PageRecord).owner_staff_id}
      />
    </NextIntlClientProvider>
  );
}
