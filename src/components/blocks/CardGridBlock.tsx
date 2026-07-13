import { Section, Container, isDarkBg, cardSurface } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap, type Locale } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { CardGridCard } from './CardGridCard';

interface ManualCard {
  title?: LocaleMap;
  body?: LocaleMap;
  image_url?: string;
  href?: string;
  link_label?: LocaleMap;
  link_url?: string;
  link_file?: { url?: string; name?: string; size?: number };
  contact_email?: string;
  contact_phone?: string;
}

interface CardGridContent {
  cards?: ManualCard[];
  buttonLabel?: LocaleMap;
}

type ResolvedCard = {
  title: string;
  body: string;
  image_url?: string;
  href?: string;
  linkLabel?: string;
  linkHref?: string;
  contactEmail?: string;
  contactPhone?: string;
};

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
      linkLabel:
        t(c.link_label, locale) ||
        ((c.link_file?.url || c.link_url) ? (locale === 'id' ? 'Buka' : 'Open') : undefined),
      // Prefer an uploaded document; fall back to a typed page/external URL.
      linkHref: c.link_file?.url || c.link_url || undefined,
      contactEmail: c.contact_email || undefined,
      contactPhone: c.contact_phone || undefined,
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
  // grid = columns of cards (default) · list = single-column rows · featured =
  // first card spans wide, the rest tile in a grid below.
  const layout = (block.config.layout as string) ?? 'grid';
  const content = block.content as CardGridContent;
  const cards = await resolveCards(source, content, locale, columns * 3);
  const onNavy = isDarkBg(block.config.background);
  const cardStyle = block.config.cardStyle as string | undefined;

  // Card behaviour — any combination may be enabled. linkToPage defaults on so
  // existing card grids keep their whole-card link behaviour.
  const options = {
    linkToPage: block.config.linkToPage !== false,
    enablePopup: block.config.enablePopup === true,
    showButton: block.config.showButton === true,
  };
  const buttonLabel = t(content.buttonLabel, locale) || (locale === 'id' ? 'Selengkapnya' : 'Learn more');
  const viewLabel = locale === 'id' ? 'Lihat halaman' : 'Visit page';

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
        ) : layout === 'list' ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {cards.map((card, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <CardGridCard card={card} onNavy={onNavy} options={options} buttonLabel={buttonLabel} viewLabel={viewLabel} cardStyle={cardStyle} variant="horizontal" />
              </Reveal>
            ))}
          </div>
        ) : layout === 'featured' && cards.length > 1 ? (
          <div className="flex flex-col gap-6">
            {/* First card spans full width as a horizontal hero card. */}
            <Reveal>
              <CardGridCard card={cards[0]} onNavy={onNavy} options={options} buttonLabel={buttonLabel} viewLabel={viewLabel} cardStyle={cardStyle} variant="horizontal" />
            </Reveal>
            <div
              className={clsx(
                'grid gap-6',
                columns === 2 && 'sm:grid-cols-2',
                columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
                columns >= 4 && 'sm:grid-cols-2 lg:grid-cols-4',
              )}
            >
              {cards.slice(1).map((card, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <CardGridCard card={card} onNavy={onNavy} options={options} buttonLabel={buttonLabel} viewLabel={viewLabel} cardStyle={cardStyle} />
                </Reveal>
              ))}
            </div>
          </div>
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
                <CardGridCard
                  card={card}
                  onNavy={onNavy}
                  options={options}
                  buttonLabel={buttonLabel}
                  viewLabel={viewLabel} cardStyle={cardStyle}
                />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
