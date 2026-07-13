import { Section, Container, isDarkBg, cardSurface } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Link } from '@/i18n/routing';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap, type Locale } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface EventItem {
  date?: string;
  endDate?: string;
  title?: LocaleMap;
  location?: LocaleMap;
  description?: LocaleMap;
  href?: string;
}

interface EventsContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
  items?: EventItem[];
}

const ACCENT_BG: Record<string, string> = {
  magenta: 'bg-magenta', amber: 'bg-amber', cyan: 'bg-cyan', blue: 'bg-blue',
  red: 'bg-red', orange: 'bg-orange', green: 'bg-green', yellow: 'bg-yellow',
};

const intl = (locale: Locale) => (locale === 'id' ? 'id-ID' : 'en-US');

/** External / protocol hrefs render as a plain <a>; internal paths use the locale <Link>. */
function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('#');
}

/** Format one event's date (or date range) for the given locale. */
function formatDate(it: EventItem, locale: Locale): string {
  if (!it.date) return '';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const start = new Date(`${it.date}T00:00:00`);
  if (isNaN(start.getTime())) return '';
  const startStr = start.toLocaleDateString(intl(locale), opts);
  if (it.endDate && it.endDate !== it.date) {
    const end = new Date(`${it.endDate}T00:00:00`);
    if (!isNaN(end.getTime())) return `${startStr} – ${end.toLocaleDateString(intl(locale), opts)}`;
  }
  return startStr;
}

/**
 * Chronological list of events / key dates (open days, webinars, deadlines).
 * Authored in-block. Upcoming events show first; past ones are dimmed and can
 * be hidden via `config.hidePast`.
 */
export function EventsBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as EventsContent;
  const accent = (block.config.accent as string) ?? 'magenta';
  const hidePast = !!block.config.hidePast;
  const onNavy = isDarkBg(block.config.background);
  const cardStyle = block.config.cardStyle as string | undefined;
  // list = divided rows (default) · cards = tiles grid · compact = dense rows.
  const layout = (block.config.layout as string) ?? 'list';
  const isCards = layout === 'cards';
  const isCompact = layout === 'compact';
  // "Today" in the university's timezone (en-CA gives YYYY-MM-DD), so events flip
  // to "past" at local midnight regardless of the server's timezone (UTC on Vercel).
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

  const dated = (c.items ?? []).filter((it) => it.date);
  const isPast = (it: EventItem) => (it.endDate || it.date || '') < today;
  const upcoming = dated.filter((it) => !isPast(it)).sort((a, b) => (a.date! < b.date! ? -1 : 1));
  const past = hidePast ? [] : dated.filter(isPast).sort((a, b) => (a.date! > b.date! ? -1 : 1));
  const rows = [...upcoming, ...past];

  const titleLink = (it: EventItem) => {
    const titleEl = (
      <InlineHtml as="span" html={t(it.title, locale)} fallback="Event" className={clsx('font-condensed uppercase tracking-wide', isCompact ? 'text-lg' : 'text-xl', onNavy ? 'text-white' : 'text-ink')} />
    );
    if (!it.href) return titleEl;
    const cls = clsx('link-underline inline-block transition-colors', onNavy ? 'hover:text-cyan' : 'hover:text-magenta');
    return isExternalHref(it.href) ? (
      <a href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>{titleEl}</a>
    ) : (
      <Link href={it.href} className={cls}>{titleEl}</Link>
    );
  };

  const dateBadge = (it: EventItem) => (
    <div className="flex items-center gap-2">
      <span className={clsx('h-2 w-2 shrink-0 rounded-full', ACCENT_BG[accent] ?? 'bg-magenta')} />
      <span className={clsx('text-sm font-medium', onNavy ? 'text-white/80' : 'text-ink/70')}>{formatDate(it, locale)}</span>
    </div>
  );

  const empty = rows.length === 0 && (
    <p className={clsx('text-sm', onNavy ? 'text-white/50' : 'text-ink/40')}>
      {locale === 'id' ? 'Belum ada acara.' : 'No events to show yet.'}
    </p>
  );

  const header = (c.heading || c.intro) && (
    <div className="mb-8 max-w-2xl">
      {t(c.heading, locale) && <Reveal><InlineHtml as="h2" html={t(c.heading, locale)} className="text-3xl md:text-4xl" /></Reveal>}
      {t(c.intro, locale) && (
        <Reveal delay={0.06}>
          <RichText html={t(c.intro, locale)} onNavy={onNavy} className={clsx('mt-3 text-lg', !onNavy && 'text-ink/70')} />
        </Reveal>
      )}
    </div>
  );

  // Cards: each event becomes a tile with the date, title, location & blurb.
  if (isCards) {
    return (
      <Section config={block.config}>
        <Container>
          {header}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((it, i) => (
              <Reveal key={i} delay={Math.min(i, 6) * 0.04}>
                <div className={clsx('flex h-full flex-col gap-2 rounded-[var(--card-r,1rem)] p-5', isPast(it) && 'opacity-55', cardSurface(cardStyle, onNavy))}>
                  {dateBadge(it)}
                  <div>{titleLink(it)}</div>
                  {t(it.location, locale) && (
                    <InlineHtml as="span" html={t(it.location, locale)} className={clsx('block text-sm', onNavy ? 'text-white/60' : 'text-ink/55')} />
                  )}
                  {t(it.description, locale) && (
                    <RichText html={t(it.description, locale)} onNavy={onNavy} className={clsx('text-sm', !onNavy && 'text-ink/65')} />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
          {empty}
        </Container>
      </Section>
    );
  }

  return (
    <Section config={block.config}>
      <Container narrow>
        {header}
        <ul className={clsx('divide-y', onNavy ? 'divide-white/10' : 'divide-ink/10')}>
          {rows.map((it, i) => (
            <Reveal key={i} delay={Math.min(i, 6) * 0.04}>
              <li className={clsx('flex flex-col gap-1 sm:flex-row sm:gap-5', isCompact ? 'py-2.5' : 'py-4', isPast(it) && 'opacity-55')}>
                <div className="sm:w-44 sm:shrink-0">{dateBadge(it)}</div>
                <div className="min-w-0 flex-1">
                  {titleLink(it)}
                  {t(it.location, locale) && (
                    <InlineHtml as="span" html={t(it.location, locale)} className={clsx('mt-0.5 block text-sm', onNavy ? 'text-white/60' : 'text-ink/55')} />
                  )}
                  {!isCompact && t(it.description, locale) && (
                    <RichText html={t(it.description, locale)} onNavy={onNavy} className={clsx('mt-1 text-sm', !onNavy && 'text-ink/65')} />
                  )}
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
        {empty}
      </Container>
    </Section>
  );
}
