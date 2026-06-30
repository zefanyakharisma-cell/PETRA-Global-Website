import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Link } from '@/i18n/routing';
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
  const onNavy = block.config.background === 'navy';
  const today = new Date().toISOString().slice(0, 10);

  const dated = (c.items ?? []).filter((it) => it.date);
  const isPast = (it: EventItem) => (it.endDate || it.date || '') < today;
  const upcoming = dated.filter((it) => !isPast(it)).sort((a, b) => (a.date! < b.date! ? -1 : 1));
  const past = hidePast ? [] : dated.filter(isPast).sort((a, b) => (a.date! > b.date! ? -1 : 1));
  const rows = [...upcoming, ...past];

  return (
    <Section config={block.config}>
      <Container narrow>
        {(c.heading || c.intro) && (
          <div className="mb-8 max-w-2xl">
            {c.heading && <Reveal><h2 className="text-3xl md:text-4xl">{t(c.heading, locale)}</h2></Reveal>}
            {c.intro && (
              <Reveal delay={0.06}>
                <p className={clsx('mt-3 text-lg', onNavy ? 'text-white/80' : 'text-ink/70')}>{t(c.intro, locale)}</p>
              </Reveal>
            )}
          </div>
        )}
        <ul className={clsx('divide-y', onNavy ? 'divide-white/10' : 'divide-ink/10')}>
          {rows.map((it, i) => {
            const past = isPast(it);
            const titleEl = (
              <span className={clsx('font-condensed text-xl uppercase tracking-wide', onNavy ? 'text-white' : 'text-ink')}>
                {t(it.title, locale) || 'Event'}
              </span>
            );
            return (
              <Reveal key={i} delay={Math.min(i, 6) * 0.04}>
                <li className={clsx('flex flex-col gap-1 py-4 sm:flex-row sm:gap-5', past && 'opacity-55')}>
                  <div className="flex items-center gap-2 sm:w-44 sm:shrink-0">
                    <span className={clsx('h-2 w-2 shrink-0 rounded-full', ACCENT_BG[accent] ?? 'bg-magenta')} />
                    <span className={clsx('text-sm font-medium', onNavy ? 'text-white/80' : 'text-ink/70')}>{formatDate(it, locale)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {it.href ? (
                      isExternalHref(it.href) ? (
                        <a href={it.href} target="_blank" rel="noopener noreferrer" className="transition hover:underline">{titleEl}</a>
                      ) : (
                        <Link href={it.href} className="transition hover:underline">{titleEl}</Link>
                      )
                    ) : (
                      titleEl
                    )}
                    {it.location && (
                      <span className={clsx('mt-0.5 block text-sm', onNavy ? 'text-white/60' : 'text-ink/55')}>{t(it.location, locale)}</span>
                    )}
                    {it.description && (
                      <span className={clsx('mt-1 block text-sm', onNavy ? 'text-white/70' : 'text-ink/65')}>{t(it.description, locale)}</span>
                    )}
                  </div>
                </li>
              </Reveal>
            );
          })}
        </ul>
        {rows.length === 0 && (
          <p className={clsx('text-sm', onNavy ? 'text-white/50' : 'text-ink/40')}>
            {locale === 'id' ? 'Belum ada acara.' : 'No events to show yet.'}
          </p>
        )}
      </Container>
    </Section>
  );
}
