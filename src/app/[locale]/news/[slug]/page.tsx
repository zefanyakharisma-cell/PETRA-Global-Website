import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/Section';
import { NewsFeedBlock } from '@/components/blocks/NewsFeedBlock';
import { createClient } from '@/lib/supabase/server';
import { t, type Locale, type LocaleMap } from '@/lib/types';

export const revalidate = 60;

async function getArticle(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('news')
    .select('id,slug,title,body,tags,published_at,cover_url')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: t(article.title as LocaleMap, locale as Locale),
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

  const article = await getArticle(slug);
  if (!article) notFound();
  const loc = locale as Locale;
  const body = t(article.body as LocaleMap, loc);
  const tags = (article.tags ?? []) as string[];

  return (
    <article>
      <header className="bg-navy py-16 text-white">
        <Container narrow>
          <p className="font-condensed uppercase tracking-widest text-cyan">
            {article.published_at ? new Date(article.published_at).toLocaleDateString(loc) : ''}
            {tags.length > 0 && ` · ${tags.map((x) => `#${x}`).join(' ')}`}
          </p>
          <h1 className="mt-3 text-4xl md:text-6xl">{t(article.title as LocaleMap, loc)}</h1>
        </Container>
      </header>

      {article.cover_url && (
        <Container narrow className="-mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-xl">
            <Image src={article.cover_url} alt="" fill className="object-cover" priority />
          </div>
        </Container>
      )}

      <Container narrow className="py-12">
        {body ? (
          <div className="prose-block max-w-reading" dangerouslySetInnerHTML={{ __html: body }} />
        ) : (
          <p className="text-ink/50">{loc === 'id' ? 'Konten belum tersedia.' : 'No content yet.'}</p>
        )}
      </Container>

      {/* Contextual: more from the first tag. */}
      <NewsFeedBlock
        block={{
          id: 'related', page_id: article.id, type: 'news_feed', position: 0,
          config: { background: 'paper', spacing: 'normal', count: 3, tag: tags[0] },
          content: { heading: { en: 'More stories', id: 'Berita lainnya' } },
        }}
        locale={loc}
        mode="public"
      />
    </article>
  );
}
