import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { getPageBySlug } from '@/lib/queries';
import { defaultHomeBlocks } from '@/lib/defaultHome';
import { localeAlternates } from '@/lib/seo';
import type { Locale } from '@/lib/types';

// ISR — revalidate public pages periodically.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale as Locale, '') };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Use the CMS `home` page when published; otherwise the built-in default.
  const cms = await getPageBySlug('home');
  const blocks = cms && cms.blocks.length > 0 ? cms.blocks : defaultHomeBlocks();
  const owner = cms?.page.owner_staff_id ?? null;

  return <BlockRenderer blocks={blocks} locale={locale as Locale} pageOwnerStaffId={owner} />;
}
