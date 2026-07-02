import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Link } from '@/i18n/routing';
import { InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface Door {
  accent: string;
  title: LocaleMap;
  blurb?: LocaleMap;
  href: string;
}

interface DoorsContent {
  doors?: Door[];
}

/**
 * Homepage triage layer — NOT the navigation. Three doors deep-link into the
 * topic clusters. Consistent color-coding: Study=magenta, Partner=blue/navy,
 * Go Abroad=amber.
 */
const ACCENT: Record<string, { ring: string; bar: string; hover: string }> = {
  magenta: { ring: 'hover:border-magenta', bar: 'bg-magenta', hover: 'group-hover:text-magenta' },
  blue: { ring: 'hover:border-blue', bar: 'bg-blue', hover: 'group-hover:text-blue' },
  amber: { ring: 'hover:border-amber', bar: 'bg-amber', hover: 'group-hover:text-amber' },
  cyan: { ring: 'hover:border-cyan', bar: 'bg-cyan', hover: 'group-hover:text-cyan' },
  red: { ring: 'hover:border-red', bar: 'bg-red', hover: 'group-hover:text-red' },
  orange: { ring: 'hover:border-orange', bar: 'bg-orange', hover: 'group-hover:text-orange' },
  green: { ring: 'hover:border-green', bar: 'bg-green', hover: 'group-hover:text-green' },
  yellow: { ring: 'hover:border-yellow', bar: 'bg-yellow', hover: 'group-hover:text-yellow' },
};

export function AudienceDoorsBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as DoorsContent;
  const doors = c.doors ?? [];
  // row = 3-up cards (default) · stack = full-width cards · list = compact rows.
  const layout = (block.config.layout as string) ?? 'row';

  // Compact single-file list: doors become divided rows inside one panel.
  if (layout === 'list') {
    return (
      <Section config={{ ...block.config, background: block.config.background ?? 'paper' }}>
        <Container>
          <div className="divide-y divide-ink/10 overflow-hidden rounded-2xl border-2 border-ink/10 bg-white">
            {doors.map((d, i) => {
              const a = ACCENT[d.accent] ?? ACCENT.magenta;
              return (
                <Reveal key={i} delay={i * 0.06}>
                  <Link href={d.href || '#'} className="group flex items-center gap-5 px-6 py-5 transition-colors hover:bg-paper/60">
                    <span className={clsx('h-10 w-1.5 shrink-0 rounded-full', a.bar)} />
                    <span className="min-w-0 flex-1">
                      <InlineHtml as="span" html={t(d.title, locale)} fallback="Door" className={clsx('block text-2xl transition-colors', a.hover)} />
                      {t(d.blurb, locale) && <InlineHtml as="span" html={t(d.blurb, locale)} className="mt-0.5 block text-ink/65" />}
                    </span>
                    <span aria-hidden className="text-2xl text-ink/40 transition-transform duration-300 ease-out group-hover:translate-x-1.5">→</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'paper' }}>
      <Container>
        <div className={clsx('grid gap-5', layout === 'stack' ? 'grid-cols-1' : 'md:grid-cols-3')}>
          {doors.map((d, i) => {
            const a = ACCENT[d.accent] ?? ACCENT.magenta;
            return (
              <Reveal key={i} delay={i * 0.08}>
                <Link
                  href={d.href || '#'}
                  className={clsx(
                    'group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-white p-7',
                    'transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lift',
                    a.ring,
                  )}
                >
                  <span
                    className={clsx('h-1.5 w-12 rounded-full transition-all duration-300 ease-out group-hover:w-20', a.bar)}
                  />
                  <InlineHtml as="h3" html={t(d.title, locale)} fallback="Door" className={clsx('mt-5 text-3xl transition-colors', a.hover)} />
                  {t(d.blurb, locale) && <InlineHtml as="p" html={t(d.blurb, locale)} className="mt-2 text-ink/70" />}
                  <span className="mt-auto flex items-center gap-2 pt-6 font-condensed uppercase tracking-wide text-ink/50 transition-colors group-hover:text-ink/80">
                    {locale === 'id' ? 'Pelajari' : 'Explore'}
                    <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1.5">
                      →
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
