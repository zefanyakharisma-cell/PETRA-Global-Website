import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Link } from '@/i18n/routing';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap, type Locale } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface ManualCard {
  title?: LocaleMap;
  body?: LocaleMap;
  image_url?: string;
  href?: string;
}

interface CardGridContent {
  cards?: ManualCard[];
}

type ResolvedCard = { title: string; body: string; image_url?: string; href?: string };

async function resolveCards(
  source: string,
  content: CardGridContent,
  locale: Locale,
  limit: number,
): Promise<ResolvedCard[]> {
  if (source === 'manual') {
    return (content.cards ?? []).map((c) => ({
      title: t(c.title, locale),
      body: t(c.body, locale),
      image_url: c.image_url,
      href: c.href,
    }));
  }
  const supabase = await createClient();
  if (source === 'programs') {
    const { data } = await supabase
      .from('programs')
      .select('slug,title,summary,cover_url,is_featured')
      .order('is_featured', { ascending: false })
      .limit(limit);
    return (data ?? []).map((p) => ({
      title: t(p.title as LocaleMap, locale),
      body: t(p.summary as LocaleMap, locale),
      image_url: p.cover_url ?? undefined,
      href: `/programs/${p.slug}`,
    }));
  }
  if (source === 'news') {
    const { data } = await supabase
      .from('news')
      .select('slug,title,cover_url,published_at')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(limit);
    return (data ?? []).map((n) => ({
      title: t(n.title as LocaleMap, locale),
      body: '',
      image_url: n.cover_url ?? undefined,
      href: `/news/${n.slug}`,
    }));
  }
  if (source === 'partners') {
    const { data } = await supabase
      .from('partners')
      .select('name,country,logo_url,url')
      .order('name')
      .limit(limit);
    return (data ?? []).map((p) => ({
      title: p.name,
      body: p.country ?? '',
      image_url: p.logo_url ?? undefined,
      href: p.url ?? undefined,
    }));
  }
  return [];
}

/** Workhorse grid. Source: manual | programs | news | partners. */
export async function CardGridBlock({ block, locale }: BlockComponentProps) {
  const source = (block.config.source as string) ?? 'manual';
  const columns = Number(block.config.columns ?? 3);
  const cards = await resolveCards(source, block.content as CardGridContent, locale, columns * 3);
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        {cards.length === 0 ? (
          <EmptyState
            onDark={onNavy}
            title={
              source === 'programs'
                ? locale === 'id' ? 'Belum ada program' : 'No programs published yet'
                : source === 'news'
                  ? locale === 'id' ? 'Belum ada berita' : 'No news published yet'
                  : source === 'partners'
                    ? locale === 'id' ? 'Belum ada mitra' : 'No partners published yet'
                    : locale === 'id' ? 'Belum ada konten' : 'Nothing here yet'
            }
            hint={locale === 'id' ? 'Konten akan tampil di sini setelah ditambahkan.' : 'Content appears here once it is added.'}
          />
        ) : (
          <div
            className={clsx(
              'grid gap-6',
              columns === 2 && 'sm:grid-cols-2',
              columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
              columns >= 4 && 'sm:grid-cols-2 lg:grid-cols-4',
            )}
          >
            {cards.map((card, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <Card card={card} onNavy={onNavy} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

function Card({ card, onNavy }: { card: ResolvedCard; onNavy: boolean }) {
  const inner = (
    <div
      className={clsx(
        'group flex h-full flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-1 hover:shadow-lg',
        onNavy ? 'border-white/15 bg-white/5' : 'border-ink/10 bg-white',
      )}
    >
      <div className="relative aspect-[16/10] bg-ink/5">
        {card.image_url && <Image src={card.image_url} alt={card.title} fill className="object-cover" />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className={clsx('text-2xl', onNavy && 'text-white')}>{card.title}</h3>
        {card.body && <p className={clsx('mt-2 text-sm', onNavy ? 'text-white/70' : 'text-ink/65')}>{card.body}</p>}
      </div>
    </div>
  );

  if (!card.href) return inner;
  if (card.href.startsWith('http')) {
    return <a href={card.href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return <Link href={card.href}>{inner}</Link>;
}
