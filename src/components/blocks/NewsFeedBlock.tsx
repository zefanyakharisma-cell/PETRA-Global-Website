import Image from 'next/image';
import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Link } from '@/i18n/routing';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface NewsFeedContent {
  heading?: LocaleMap;
}

/**
 * News from the `news` entity. Contextual mode: when `config.tag` is set
 * (e.g. on a program/partnership page) it surfaces "related by #tag" posts.
 */
export async function NewsFeedBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as NewsFeedContent;
  const count = Number(block.config.count ?? 3);
  const tag = block.config.tag as string | undefined;

  const supabase = await createClient();
  let query = supabase
    .from('news')
    .select('slug,title,cover_url,published_at,tags')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(count);

  if (tag) query = query.contains('tags', [tag]);

  const { data } = await query;
  const items = data ?? [];
  const onNavy = isDarkBg(block.config.background);
  // grid (default 3-up) · list (horizontal rows) · featured (first large).
  const layout = (block.config.layout as string) ?? 'grid';

  type NewsRow = (typeof items)[number];
  const card = (n: NewsRow, variant: 'vertical' | 'horizontal' | 'hero') => {
    const horizontal = variant === 'horizontal';
    const hero = variant === 'hero';
    return (
      <Link href={`/news/${n.slug}`} className={clsx('group', horizontal ? 'flex gap-5' : 'block')}>
        <div
          className={clsx(
            'media-zoom relative overflow-hidden rounded-[var(--card-r,0.75rem)] bg-ink/5 ring-1 ring-ink/5 transition-shadow duration-300 group-hover:shadow-lift',
            horizontal ? 'aspect-[16/10] w-40 shrink-0 sm:w-56' : hero ? 'aspect-[16/8]' : 'aspect-[16/10]',
          )}
        >
          {n.cover_url && <Image src={n.cover_url} alt="" fill className="object-cover" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className={clsx(horizontal && 'flex flex-col justify-center')}>
          <p className="mt-3 text-xs uppercase tracking-wide text-magenta">
            {n.published_at ? new Date(n.published_at).toLocaleDateString(locale) : ''}
          </p>
          <h3 className={clsx('mt-1 transition-colors', hero ? 'text-2xl md:text-3xl' : 'text-xl', onNavy ? 'text-white group-hover:text-cyan' : 'text-ink group-hover:text-magenta')}>
            {t(n.title as LocaleMap, locale)}
          </h3>
        </div>
      </Link>
    );
  };

  return (
    <Section config={block.config}>
      <Container>
        {t(c.heading, locale) && <InlineHtml as="h2" html={t(c.heading, locale)} className="mb-8 text-3xl md:text-4xl" />}
        {items.length === 0 ? (
          <EmptyState
            onDark={onNavy}
            title={locale === 'id' ? 'Belum ada berita' : 'No news published yet'}
            hint={tag ? (locale === 'id' ? `Belum ada artikel #${tag}.` : `No #${tag} stories yet.`) : undefined}
          />
        ) : layout === 'list' ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {items.map((n, i) => (
              <Reveal key={i} delay={i * 0.05}>{card(n, 'horizontal')}</Reveal>
            ))}
          </div>
        ) : layout === 'featured' && items.length > 1 ? (
          <div className="flex flex-col gap-8">
            <Reveal>{card(items[0], 'hero')}</Reveal>
            <div className="grid gap-6 md:grid-cols-3">
              {items.slice(1).map((n, i) => (
                <Reveal key={i} delay={i * 0.05}>{card(n, 'vertical')}</Reveal>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {items.map((n, i) => (
              <Reveal key={i} delay={i * 0.05}>{card(n, 'vertical')}</Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
