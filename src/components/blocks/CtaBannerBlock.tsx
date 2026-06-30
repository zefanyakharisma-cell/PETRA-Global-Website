import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Cta } from '@/components/ui/Cta';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface CtaBannerContent {
  eyebrow?: LocaleMap;
  heading?: LocaleMap;
  subcopy?: LocaleMap;
  ctas?: { label: LocaleMap; href: string; variant?: 'magenta' | 'amber' | 'blue' | 'outline' }[];
}

const ACCENT_TEXT: Record<string, string> = {
  magenta: 'text-magenta',
  amber: 'text-amber',
  cyan: 'text-cyan',
  blue: 'text-blue',
  red: 'text-red',
  orange: 'text-orange',
  green: 'text-green',
  yellow: 'text-yellow',
};

/** Focused call-to-action band — a punchy heading + up to two buttons. */
export function CtaBannerBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as CtaBannerContent;
  const align = (block.config.alignment as string) ?? 'center';
  const accent = (block.config.accent as string) ?? 'cyan';
  const onNavy = (block.config.background ?? 'navy') === 'navy';
  const center = align === 'center';

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container>
        <div
          className={clsx(
            'flex flex-col gap-6 md:flex-row md:items-center',
            center ? 'text-center md:justify-center md:text-center' : 'md:justify-between',
          )}
        >
          <div className={clsx('max-w-2xl', center && 'mx-auto')}>
            {c.eyebrow && (
              <Reveal>
                <p
                  className={clsx(
                    'font-condensed text-base uppercase tracking-widest',
                    onNavy ? 'text-cyan' : (ACCENT_TEXT[accent] ?? 'text-magenta'),
                  )}
                >
                  {t(c.eyebrow, locale)}
                </p>
              </Reveal>
            )}
            <Reveal delay={0.06}>
              <h2 className="mt-2 text-3xl md:text-4xl">{t(c.heading, locale) || 'Ready to begin?'}</h2>
            </Reveal>
            {c.subcopy && (
              <Reveal delay={0.12}>
                <p className={clsx('mt-3 text-lg', onNavy ? 'text-white/80' : 'text-ink/70')}>
                  {t(c.subcopy, locale)}
                </p>
              </Reveal>
            )}
          </div>
          {c.ctas && c.ctas.length > 0 && (
            <Reveal delay={0.18}>
              <div className={clsx('flex flex-wrap gap-3', center && 'justify-center')}>
                {c.ctas.slice(0, 2).map((cta, i) => (
                  <Cta key={i} href={cta.href || '#'} variant={cta.variant ?? (i === 0 ? 'magenta' : 'outline')}>
                    {t(cta.label, locale)}
                  </Cta>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </Section>
  );
}
