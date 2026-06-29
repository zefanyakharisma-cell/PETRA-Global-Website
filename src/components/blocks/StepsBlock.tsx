import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
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
  const horizontal = (block.config.orientation as string) === 'horizontal';
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        {c.heading && <h2 className="mb-8 text-3xl md:text-4xl">{t(c.heading, locale)}</h2>}
        <ol className={clsx('gap-6', horizontal ? 'grid md:grid-cols-3 lg:grid-cols-4' : 'space-y-6')}>
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <li className="flex gap-4">
                <span
                  className={clsx(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-2xl',
                    onNavy ? 'bg-amber text-ink' : 'bg-navy text-white',
                  )}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className={clsx('text-xl', onNavy && 'text-white')}>{t(s.title, locale)}</h3>
                  {s.body && <p className={clsx('mt-1 text-sm', onNavy ? 'text-white/75' : 'text-ink/65')}>{t(s.body, locale)}</p>}
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
