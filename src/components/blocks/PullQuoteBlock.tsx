import Image from 'next/image';
import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { InlineHtml, stripHtml } from '@/components/ui/RichText';
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
  const onNavy = isDarkBg(block.config.background ?? 'navy');
  // centered (default) · side (portrait beside, left-aligned) · card (boxed).
  const layout = (block.config.layout as string) ?? 'centered';
  const side = layout === 'side';
  const card = layout === 'card';

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container narrow>
        <Reveal>
          <figure
            className={clsx(
              'flex flex-col items-center gap-6 text-center',
              side && c.portrait_url && 'sm:flex-row sm:text-left',
              card && clsx('rounded-2xl p-8 md:p-10', onNavy ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white shadow-sm ring-1 ring-ink/5'),
            )}
          >
            {c.portrait_url && (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
                <Image src={c.portrait_url} alt={stripHtml(t(c.attribution, locale))} fill className="object-cover" />
              </div>
            )}
            <div>
              <blockquote className={clsx('font-editorial text-3xl leading-snug md:text-4xl', onNavy ? 'text-white' : 'text-navy')}>
                &ldquo;
                {t(c.quote, locale) ? (
                  <span className="[&_p]:m-0 [&_p]:inline" dangerouslySetInnerHTML={{ __html: t(c.quote, locale) }} />
                ) : (
                  'A memorable line from a student or partner.'
                )}
                &rdquo;
              </blockquote>
              {t(c.attribution, locale) && (
                <InlineHtml
                  as="figcaption"
                  html={t(c.attribution, locale)}
                  className={clsx('mt-4 font-condensed uppercase tracking-wide', onNavy ? 'text-cyan' : 'text-magenta')}
                />
              )}
            </div>
          </figure>
        </Reveal>
      </Container>
    </Section>
  );
}
