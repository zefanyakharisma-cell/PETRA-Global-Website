import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Cta } from '@/components/ui/Cta';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface CtaBannerContent {
  eyebrow?: LocaleMap;
  heading?: LocaleMap;
  subcopy?: LocaleMap;
  ctas?: { label: LocaleMap; href: string; variant?: 'magenta' | 'amber' | 'blue' | 'navy' | 'outline'; newTab?: boolean }[];
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
  // center (default) · split (text left, buttons right) · stacked (buttons below).
  const align = (block.config.alignment as string) ?? 'center';
  const accent = (block.config.accent as string) ?? 'cyan';
  const onNavy = isDarkBg(block.config.background ?? 'navy');
  const center = align === 'center';
  const stacked = align === 'stacked';

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }} className="relative overflow-hidden">
      {onNavy && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-cyan/10 blur-3xl" />
          <div className="absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-magenta/10 blur-3xl" />
        </div>
      )}
      <Container className="relative z-10">
        <div
          className={clsx(
            'flex flex-col gap-6',
            !stacked && 'md:flex-row md:items-center',
            center && 'text-center md:justify-center',
            align === 'split' && 'md:justify-between',
          )}
        >
          <div className={clsx('max-w-2xl', center && 'mx-auto')}>
            {t(c.eyebrow, locale) && (
              <Reveal>
                <InlineHtml
                  as="p"
                  html={t(c.eyebrow, locale)}
                  className={clsx(
                    'font-condensed text-base uppercase tracking-widest',
                    onNavy ? 'text-cyan' : (ACCENT_TEXT[accent] ?? 'text-magenta'),
                  )}
                />
              </Reveal>
            )}
            <Reveal delay={0.06}>
              <InlineHtml as="h2" html={t(c.heading, locale)} fallback="Ready to begin?" className="mt-2 text-3xl md:text-4xl" />
            </Reveal>
            {t(c.subcopy, locale) && (
              <Reveal delay={0.12}>
                <RichText html={t(c.subcopy, locale)} onNavy={onNavy} className={clsx('mt-3 text-lg', !onNavy && 'text-ink/70')} />
              </Reveal>
            )}
          </div>
          {c.ctas && c.ctas.length > 0 && (
            <Reveal delay={0.18}>
              <div className={clsx('flex flex-wrap gap-3', center && 'justify-center')}>
                {c.ctas.slice(0, 2).map((cta, i) => (
                  <Cta key={i} href={cta.href || '#'} variant={cta.variant || (i === 0 ? 'magenta' : 'outline')} newTab={cta.newTab}>
                    <InlineHtml as="span" html={t(cta.label, locale)} />
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
