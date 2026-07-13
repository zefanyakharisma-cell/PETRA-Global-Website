import Image from 'next/image';
import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Cta } from '@/components/ui/Cta';
import { RichText, InlineHtml, stripHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

type CtaItem = { label?: LocaleMap; href?: string; variant?: 'magenta' | 'amber' | 'blue' | 'navy' | 'outline'; newTab?: boolean };

interface SplitContent {
  heading?: LocaleMap;
  body?: LocaleMap;
  image_url?: string;
  // Stored as a list in the registry; we render the first button.
  cta?: CtaItem[] | CtaItem;
}

export function ImageTextSplitBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as SplitContent;
  const layout = (block.config.imageSide as string) ?? 'left';
  const imageRight = layout === 'right';
  const stacked = layout === 'stacked';
  const onNavy = isDarkBg(block.config.background);
  const cta = Array.isArray(c.cta) ? c.cta[0] : c.cta;

  const media = (
    <div
      className={clsx(
        'group media-zoom relative overflow-hidden rounded-2xl bg-ink/5 shadow-lg ring-1 ring-ink/5',
        stacked ? 'aspect-[16/7]' : 'aspect-[4/3]',
      )}
    >
      {c.image_url ? (
        <Image src={c.image_url} alt={stripHtml(t(c.heading, locale))} fill className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-ink/30">
          {locale === 'id' ? 'Gambar' : 'Image'}
        </div>
      )}
      {/* Quiet gradient that lifts on hover, echoing the card treatment. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );

  const copy = (
    <>
      <InlineHtml as="h2" html={t(c.heading, locale)} fallback="Heading" className="text-3xl md:text-4xl" />
      <span aria-hidden className={clsx('mt-4 inline-block h-1 w-12 rounded-full align-middle', onNavy ? 'bg-cyan' : 'bg-magenta')} />
      {t(c.body, locale) && (
        <RichText html={t(c.body, locale)} onNavy={onNavy} className={clsx('mt-4 text-lg', !onNavy && 'text-ink/70')} />
      )}
      {cta?.href && (
        <div className="mt-6">
          <Cta href={cta.href} variant={cta.variant || (onNavy ? 'amber' : 'navy')} newTab={cta.newTab}>
            <InlineHtml as="span" html={t(cta.label, locale)} />
          </Cta>
        </div>
      )}
    </>
  );

  if (stacked) {
    return (
      <Section config={block.config}>
        <Container>
          <Reveal>{media}</Reveal>
          <Reveal delay={0.1} className="mx-auto mt-8 max-w-3xl text-center">{copy}</Reveal>
        </Container>
      </Section>
    );
  }

  return (
    <Section config={block.config}>
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal className={clsx(imageRight && 'md:order-2')}>{media}</Reveal>
          <Reveal delay={0.1}>{copy}</Reveal>
        </div>
      </Container>
    </Section>
  );
}
