import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface Step {
  title?: LocaleMap;
  body?: LocaleMap;
}

interface StepsContent {
  heading?: LocaleMap;
  steps?: Step[];
}

/** Ordered process/timeline (e.g. "How to apply"). Numbered, vertical/horizontal. */
export function StepsBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as StepsContent;
  const steps = c.steps ?? [];
  // vertical (default) · horizontal row · cards (bordered tiles).
  const orientation = (block.config.orientation as string) ?? 'vertical';
  const horizontal = orientation === 'horizontal';
  const isCards = orientation === 'cards';
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        {t(c.heading, locale) && <InlineHtml as="h2" html={t(c.heading, locale)} className="mb-8 text-3xl md:text-4xl" />}
        <ol className={clsx('gap-6', horizontal || isCards ? 'grid md:grid-cols-3 lg:grid-cols-4' : 'space-y-6')}>
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <li
                className={clsx(
                  isCards
                    ? clsx('flex flex-col gap-3 rounded-2xl border p-6', onNavy ? 'border-white/15 bg-white/5' : 'border-ink/10 bg-white shadow-sm')
                    : 'flex gap-4',
                )}
              >
                <span
                  className={clsx(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-2xl',
                    onNavy ? 'bg-amber text-ink' : 'bg-navy text-white',
                  )}
                >
                  {i + 1}
                </span>
                <div>
                  <InlineHtml as="h3" html={t(s.title, locale)} className={clsx('text-xl', onNavy && 'text-white')} />
                  {t(s.body, locale) && <RichText html={t(s.body, locale)} onNavy={onNavy} className={clsx('mt-1 text-sm', !onNavy && 'text-ink/65')} />}
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
