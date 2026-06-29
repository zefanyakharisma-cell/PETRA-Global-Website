import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Cta } from '@/components/ui/Cta';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface HeroContent {
  eyebrow?: LocaleMap;
  heading?: LocaleMap;
  subcopy?: LocaleMap;
  image_url?: string;
  ctas?: { label: LocaleMap; href: string; variant?: 'magenta' | 'amber' | 'blue' | 'outline' }[];
}

/** Full-bleed hero. Staggered reveal: eyebrow -> headline -> subcopy -> CTAs. */
export function HeroBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as HeroContent;
  const layout = (block.config.layout as string) ?? 'centered';
  const split = layout === 'split-with-image';
  const onImage = !!c.image_url && !split;

  return (
    <Section
      config={{ ...block.config, background: block.config.background ?? 'navy' }}
      className="relative overflow-hidden"
    >
      {onImage && (
        <div className="absolute inset-0 -z-10">
          <Image src={c.image_url!} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
      )}
      <Container>
        <div
          className={clsx(
            'grid items-center gap-10',
            split ? 'md:grid-cols-2' : 'max-w-3xl',
            layout === 'centered' && 'mx-auto text-center',
            layout === 'left' && 'text-left',
          )}
        >
          <div>
            {c.eyebrow && (
              <Reveal>
                <p className="font-condensed text-lg uppercase tracking-widest text-cyan">
                  {t(c.eyebrow, locale)}
                </p>
              </Reveal>
            )}
            <Reveal delay={0.08}>
              <h1 className="mt-3 text-5xl leading-[0.95] md:text-7xl">
                {t(c.heading, locale) || 'Headline'}
              </h1>
            </Reveal>
            {c.subcopy && (
              <Reveal delay={0.16}>
                <p className="mt-5 max-w-xl font-body text-lg text-white/85">
                  {t(c.subcopy, locale)}
                </p>
              </Reveal>
            )}
            {c.ctas && c.ctas.length > 0 && (
              <Reveal delay={0.24}>
                <div
                  className={clsx(
                    'mt-8 flex flex-wrap gap-3',
                    layout === 'centered' && 'justify-center',
                  )}
                >
                  {c.ctas.slice(0, 2).map((cta, i) => (
                    <Cta key={i} href={cta.href || '#'} variant={cta.variant ?? (i === 0 ? 'magenta' : 'outline')}>
                      {t(cta.label, locale)}
                    </Cta>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
          {split && c.image_url && (
            <Reveal delay={0.12}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={c.image_url} alt="" fill className="object-cover" />
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </Section>
  );
}
