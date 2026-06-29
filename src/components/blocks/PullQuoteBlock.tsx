import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface PullQuoteContent {
  quote?: LocaleMap;
  attribution?: LocaleMap;
  portrait_url?: string;
}

/** Editorial pull quote — the only block set in Baskerville (font-editorial). */
export function PullQuoteBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as PullQuoteContent;
  const onNavy = (block.config.background ?? 'navy') === 'navy';

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container narrow>
        <Reveal>
          <figure className={clsx('flex flex-col items-center gap-6 text-center', c.portrait_url && 'sm:flex-row sm:text-left')}>
            {c.portrait_url && (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
                <Image src={c.portrait_url} alt={t(c.attribution, locale)} fill className="object-cover" />
              </div>
            )}
            <div>
              <blockquote className={clsx('font-editorial text-3xl leading-snug md:text-4xl', onNavy ? 'text-white' : 'text-navy')}>
                &ldquo;{t(c.quote, locale) || 'A memorable line from a student or partner.'}&rdquo;
              </blockquote>
              {c.attribution && (
                <figcaption className={clsx('mt-4 font-condensed uppercase tracking-wide', onNavy ? 'text-cyan' : 'text-magenta')}>
                  {t(c.attribution, locale)}
                </figcaption>
              )}
            </div>
          </figure>
        </Reveal>
      </Container>
    </Section>
  );
}
