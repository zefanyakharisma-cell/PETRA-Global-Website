import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
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
};
const ACCENT_TEXT: Record<string, string> = {
  magenta: 'text-magenta',
  amber: 'text-amber',
  cyan: 'text-cyan',
  blue: 'text-blue',
};

/** Vertical timeline — milestones, history, or an application schedule. */
export function TimelineBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as TimelineContent;
  const items = c.items ?? [];
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container narrow>
        {(c.heading || c.intro) && (
          <div className="mb-10 max-w-2xl">
            {c.heading && (
              <Reveal>
                <h2 className="text-4xl md:text-5xl">{t(c.heading, locale)}</h2>
              </Reveal>
            )}
            {c.intro && (
              <Reveal delay={0.06}>
                <p className={clsx('mt-4 text-lg', onNavy ? 'text-white/80' : 'text-ink/70')}>
                  {t(c.intro, locale)}
                </p>
              </Reveal>
            )}
          </div>
        )}
        <ol className="relative border-l border-current/15">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <li className="relative ml-6 pb-8 last:pb-0">
                <span
                  className={clsx(
                    'absolute -left-[1.92rem] mt-1.5 h-3 w-3 rounded-full ring-4',
                    ACCENT_BG[accent],
                    onNavy ? 'ring-navy' : 'ring-paper',
                  )}
                />
                {item.date && (
                  <p className={clsx('font-condensed text-sm uppercase tracking-widest', ACCENT_TEXT[accent])}>
                    {item.date}
                  </p>
                )}
                {item.title && (
                  <h3 className="mt-1 text-xl md:text-2xl">{t(item.title, locale)}</h3>
                )}
                {item.body && (
                  <p className={clsx('mt-1.5', onNavy ? 'text-white/75' : 'text-ink/65')}>
                    {t(item.body, locale)}
                  </p>
                )}
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
