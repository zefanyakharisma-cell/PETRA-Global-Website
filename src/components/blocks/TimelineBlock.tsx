import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface TimelineItem {
  date?: string;
  title?: LocaleMap;
  body?: LocaleMap;
}

interface TimelineContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
  items?: TimelineItem[];
}

const ACCENT_BG: Record<string, string> = {
  magenta: 'bg-magenta',
  amber: 'bg-amber',
  cyan: 'bg-cyan',
  blue: 'bg-blue',
  red: 'bg-red',
  orange: 'bg-orange',
  green: 'bg-green',
  yellow: 'bg-yellow',
};
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

/** Vertical timeline — milestones, history, or an application schedule. */
export function TimelineBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as TimelineContent;
  const items = c.items ?? [];
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = block.config.background === 'navy';
  // vertical (default) · alternating (left/right of a centre line) · horizontal.
  const layout = (block.config.layout as string) ?? 'vertical';
  const dotRing = onNavy ? 'ring-navy' : 'ring-paper';

  // Shared date/title/body markup for one milestone.
  const body = (item: TimelineItem) => (
    <>
      {item.date && (
        <InlineHtml as="p" html={item.date} className={clsx('font-condensed text-sm uppercase tracking-widest', ACCENT_TEXT[accent])} />
      )}
      {t(item.title, locale) && (
        <InlineHtml as="h3" html={t(item.title, locale)} className="mt-1 text-xl md:text-2xl" />
      )}
      {t(item.body, locale) && (
        <RichText html={t(item.body, locale)} onNavy={onNavy} className={clsx('mt-1.5', !onNavy && 'text-ink/65')} />
      )}
    </>
  );

  const header = (c.heading || c.intro) && (
    <div className="mb-10 max-w-2xl">
      {t(c.heading, locale) && (
        <Reveal>
          <InlineHtml as="h2" html={t(c.heading, locale)} className="text-4xl md:text-5xl" />
        </Reveal>
      )}
      {t(c.intro, locale) && (
        <Reveal delay={0.06}>
          <RichText html={t(c.intro, locale)} onNavy={onNavy} className={clsx('mt-4 text-lg', !onNavy && 'text-ink/70')} />
        </Reveal>
      )}
    </div>
  );

  if (layout === 'horizontal') {
    return (
      <Section config={block.config}>
        <Container>
          {header}
          <ol className="flex snap-x gap-6 overflow-x-auto pb-4 md:grid md:auto-cols-fr md:grid-flow-col md:overflow-visible">
            {items.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <li className={clsx('relative min-w-[220px] snap-start border-t-2 pt-6 md:min-w-0', onNavy ? 'border-white/15' : 'border-ink/15')}>
                  <span className={clsx('absolute -top-[0.45rem] left-0 h-3 w-3 rounded-full ring-4', ACCENT_BG[accent], dotRing)} />
                  {body(item)}
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>
    );
  }

  if (layout === 'alternating') {
    return (
      <Section config={block.config}>
        <Container>
          {header}
          <ol className="relative">
            <span aria-hidden className={clsx('absolute bottom-1 top-1 left-4 w-px md:left-1/2 md:-translate-x-1/2', onNavy ? 'bg-white/15' : 'bg-ink/15')} />
            {items.map((item, i) => {
              const left = i % 2 === 0;
              return (
                <Reveal key={i} delay={i * 0.05}>
                  <li className="relative pb-8 pl-12 last:pb-0 md:grid md:grid-cols-2 md:gap-10 md:pl-0">
                    <span className={clsx('absolute top-1.5 left-4 h-3 w-3 -translate-x-1/2 rounded-full ring-4 md:left-1/2', ACCENT_BG[accent], dotRing)} />
                    <div className={clsx(left ? 'md:col-start-1 md:pr-10 md:text-right' : 'md:col-start-2 md:pl-10')}>
                      {body(item)}
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </Container>
      </Section>
    );
  }

  return (
    <Section config={block.config}>
      <Container narrow>
        {header}
        <ol className={clsx('relative border-l', onNavy ? 'border-white/15' : 'border-ink/15')}>
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <li className="relative ml-6 pb-8 last:pb-0">
                <span className={clsx('absolute -left-[1.92rem] mt-1.5 h-3 w-3 rounded-full ring-4', ACCENT_BG[accent], dotRing)} />
                {body(item)}
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
