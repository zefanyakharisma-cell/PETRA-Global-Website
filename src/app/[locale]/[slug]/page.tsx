import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { getPageBySlug } from '@/lib/queries';
import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

export const revalidate = 60;

// Reserved segments handled by their own routes.
const RESERVED = new Set(['programs', 'news', 'partnership', 'thank-you', 'api', 'admin']);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getPageBySlug(slug);
  if (!data) return {};
  return pageMetadata(data.page, locale as Locale, `/${slug}`);
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (RESERVED.has(slug)) notFound();
  setRequestLocale(locale);

  const data = await getPageBySlug(slug);
  if (!data) notFound();

  return (
    <BlockRenderer
      blocks={data.blocks}
      locale={locale as Locale}
      pageOwnerStaffId={data.page.owner_staff_id}
    />
  );
}
