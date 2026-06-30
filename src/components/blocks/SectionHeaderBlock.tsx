import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface SectionHeaderContent {
  eyebrow?: LocaleMap;
  heading?: LocaleMap;
  intro?: LocaleMap;
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

export function SectionHeaderBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as SectionHeaderContent;
  const align = (block.config.alignment as string) ?? 'left';
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
          {c.eyebrow && (
            <Reveal>
              <p className={clsx('font-condensed text-base uppercase tracking-widest', ACCENT_TEXT[accent])}>
                {t(c.eyebrow, locale)}
              </p>
            </Reveal>
          )}
          <Reveal delay={0.06}>
            <h2 className="mt-2 text-4xl md:text-5xl">{t(c.heading, locale) || 'Section heading'}</h2>
          </Reveal>
          {c.intro && (
            <Reveal delay={0.12}>
              <p className={clsx('mt-4 text-lg', onNavy ? 'text-white/80' : 'text-ink/70')}>
                {t(c.intro, locale)}
              </p>
            </Reveal>
          )}
        </div>
      </Container>
    </Section>
  );
}
