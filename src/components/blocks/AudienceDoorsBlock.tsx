import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Link } from '@/i18n/routing';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface Door {
  accent: 'magenta' | 'blue' | 'amber';
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
};

export function AudienceDoorsBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as DoorsContent;
  const doors = c.doors ?? [];

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'paper' }}>
      <Container>
        <div className="grid gap-5 md:grid-cols-3">
          {doors.map((d, i) => {
            const a = ACCENT[d.accent] ?? ACCENT.magenta;
            return (
              <Reveal key={i} delay={i * 0.08}>
                <Link
                  href={d.href || '#'}
                  className={clsx(
                    'group flex h-full flex-col rounded-2xl border-2 border-ink/10 bg-white p-7 transition',
                    'hover:-translate-y-1 hover:shadow-lg',
                    a.ring,
                  )}
                >
                  <span className={clsx('h-1.5 w-12 rounded-full', a.bar)} />
                  <h3 className={clsx('mt-5 text-3xl transition-colors', a.hover)}>
                    {t(d.title, locale) || 'Door'}
                  </h3>
                  {d.blurb && <p className="mt-2 text-ink/70">{t(d.blurb, locale)}</p>}
                  <span className="mt-auto pt-6 font-condensed uppercase tracking-wide text-ink/50">
                    {locale === 'id' ? 'Pelajari →' : 'Explore →'}
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
