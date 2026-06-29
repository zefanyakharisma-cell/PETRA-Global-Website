import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Link } from '@/i18n/routing';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
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
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        {c.heading && <h2 className="mb-8 text-3xl md:text-4xl">{t(c.heading, locale)}</h2>}
        {items.length === 0 ? (
          <EmptyState
            onDark={onNavy}
            title={locale === 'id' ? 'Belum ada berita' : 'No news published yet'}
            hint={tag ? (locale === 'id' ? `Belum ada artikel #${tag}.` : `No #${tag} stories yet.`) : undefined}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {items.map((n, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <Link href={`/news/${n.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-ink/5">
                    {n.cover_url && <Image src={n.cover_url} alt="" fill className="object-cover transition group-hover:scale-105" />}
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-magenta">
                    {n.published_at ? new Date(n.published_at).toLocaleDateString(locale) : ''}
                  </p>
                  <h3 className={clsx('mt-1 text-xl', onNavy && 'text-white')}>{t(n.title as LocaleMap, locale)}</h3>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
