import Image from 'next/image';
import { Container } from '@/components/ui/Section';
import { t, type Locale, type LocaleMap, type NewsRecord } from '@/lib/types';

/**
 * Shared masthead for a news article — title, publish date, tags and cover
 * image. Used by the public /news/[slug] page and the editor preview so both
 * stay in sync. The article body is rendered separately as blocks.
 */
export function NewsArticleHeader({
  article,
  locale,
}: {
  article: NewsRecord;
  locale: Locale;
}) {
  const tags = (article.tags ?? []) as string[];

  return (
    <>
      <header className="bg-navy py-16 text-white">
        <Container narrow>
          <p className="font-condensed uppercase tracking-widest text-cyan">
            {article.published_at ? new Date(article.published_at).toLocaleDateString(locale) : ''}
            {tags.length > 0 && ` · ${tags.map((x) => `#${x}`).join(' ')}`}
          </p>
          <h1 className="mt-3 text-4xl md:text-6xl">{t(article.title as LocaleMap, locale)}</h1>
        </Container>
      </header>

      {article.cover_url && (
        <Container narrow className="-mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-xl">
            <Image src={article.cover_url} alt="" fill className="object-cover" priority />
          </div>
        </Container>
      )}
    </>
  );
}
