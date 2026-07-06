import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Section';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { getNewsBySlug } from '@/lib/queries';
import { localeAlternates } from '@/lib/seo';
import { t, type Locale, type LocaleMap } from '@/lib/types';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getNewsBySlug(slug);
  if (!data) return {};
  const { article } = data;
  return {
    title: t(article.title as LocaleMap, locale as Locale),
    alternates: localeAlternates(locale as Locale, `/news/${slug}`),
    openGraph: { images: article.cover_url ? [{ url: article.cover_url }] : undefined },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await getNewsBySlug(slug);
  if (!data) notFound();
  const { article, blocks } = data;
  const loc = locale as Locale;

  // Everything on a news article is now block-driven — the masthead/hero is a
  // Hero block, the body is content blocks, related stories a News feed block.
  // Legacy articles that predate the block editor and only carry a rich-text
  // `body` fall back to that HTML.
  const body = t(article.body as LocaleMap, loc);

  return (
    <article>
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} locale={loc} />
      ) : (
        <Container narrow className="py-12">
          {body ? (
            <div className="prose-block max-w-reading" dangerouslySetInnerHTML={{ __html: body }} />
          ) : (
            <p className="text-ink/50">{loc === 'id' ? 'Konten belum tersedia.' : 'No content yet.'}</p>
          )}
        </Container>
      )}
    </article>
  );
}
