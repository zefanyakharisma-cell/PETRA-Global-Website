import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Section';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { NewsArticleHeader } from '@/components/blocks/NewsArticleHeader';
import { NewsFeedBlock } from '@/components/blocks/NewsFeedBlock';
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
  const tags = (article.tags ?? []) as string[];

  // Articles built with the block editor render their blocks. Legacy articles
  // that only carry a rich-text `body` fall back to that HTML.
  const body = t(article.body as LocaleMap, loc);

  return (
    <article>
      <NewsArticleHeader article={article} locale={loc} />

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

      {/* Contextual: more from the first tag. */}
      <NewsFeedBlock
        block={{
          id: 'related', news_id: article.id, type: 'news_feed', position: 0,
          config: { background: 'paper', spacing: 'normal', count: 3, tag: tags[0] },
          content: { heading: { en: 'More stories', id: 'Berita lainnya' } },
        }}
        locale={loc}
        mode="public"
      />
    </article>
  );
}
