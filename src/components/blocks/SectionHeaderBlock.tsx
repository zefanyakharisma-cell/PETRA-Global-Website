import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { RichText, InlineHtml } from '@/components/ui/RichText';
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

const ACCENT_BORDER: Record<string, string> = {
  magenta: 'border-magenta',
  amber: 'border-amber',
  cyan: 'border-cyan',
  blue: 'border-blue',
  red: 'border-red',
  orange: 'border-orange',
  green: 'border-green',
  yellow: 'border-yellow',
};

export function SectionHeaderBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as SectionHeaderContent;
  // `layout` supersedes the older `alignment` key; fall back for existing blocks.
  const layout = (block.config.layout as string) ?? (block.config.alignment as string) ?? 'left';
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = isDarkBg(block.config.background);
  const boxed = layout === 'boxed';

  return (
    <Section config={block.config}>
      <Container>
        <div
          className={clsx(
            'max-w-2xl',
            layout === 'center' && 'mx-auto text-center',
            boxed && clsx(
              'max-w-3xl rounded-2xl border-l-4 p-8',
              ACCENT_BORDER[accent],
              onNavy ? 'bg-white/5' : 'bg-white shadow-sm ring-1 ring-ink/5',
            ),
          )}
        >
          {t(c.eyebrow, locale) && (
            <Reveal>
              <InlineHtml as="p" html={t(c.eyebrow, locale)} className={clsx('font-condensed text-base uppercase tracking-widest', ACCENT_TEXT[accent])} />
            </Reveal>
          )}
          <Reveal delay={0.06}>
            <InlineHtml as="h2" html={t(c.heading, locale)} fallback="Section heading" className="mt-2 text-4xl md:text-5xl" />
          </Reveal>
          {t(c.intro, locale) && (
            <Reveal delay={0.12}>
              <RichText html={t(c.intro, locale)} onNavy={onNavy} className={clsx('mt-4 text-lg', !onNavy && 'text-ink/70')} />
            </Reveal>
          )}
        </div>
      </Container>
    </Section>
  );
}
