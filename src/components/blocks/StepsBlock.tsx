import { Section, Container, isDarkBg } from '@/components/ui/Section';
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
  const onNavy = isDarkBg(block.config.background);

  return (
    <Section config={block.config}>
      <Container>
        {t(c.heading, locale) && <InlineHtml as="h2" html={t(c.heading, locale)} className="mb-8 text-3xl md:text-4xl" />}
        <ol className={clsx('gap-6', horizontal || isCards ? 'grid md:grid-cols-3 lg:grid-cols-4' : 'space-y-6')}>
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <li
                className={clsx(
                  'group',
                  isCards
                    ? clsx(
                        'flex flex-col gap-3 rounded-2xl border p-6 transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lift',
                        onNavy ? 'border-white/15 bg-white/5 hover:border-white/30' : 'border-ink/10 bg-white shadow-sm hover:border-ink/20',
                      )
                    : 'flex gap-4',
                )}
              >
                <span
                  className={clsx(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-2xl ring-4 ring-transparent transition-all duration-300 group-hover:scale-105',
                    onNavy ? 'bg-amber text-ink group-hover:ring-amber/20' : 'bg-navy text-white group-hover:ring-navy/10',
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
