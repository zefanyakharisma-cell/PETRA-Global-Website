import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Cta } from '@/components/ui/Cta';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface SplitContent {
  heading?: LocaleMap;
  body?: LocaleMap;
  image_url?: string;
  cta?: { label: LocaleMap; href: string };
}

export function ImageTextSplitBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as SplitContent;
  const imageRight = (block.config.imageSide as string) === 'right';
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal className={clsx(imageRight && 'md:order-2')}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink/5">
              {c.image_url ? (
                <Image src={c.image_url} alt={t(c.heading, locale)} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink/30">
                  {locale === 'id' ? 'Gambar' : 'Image'}
                </div>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-4xl">{t(c.heading, locale) || 'Heading'}</h2>
            {c.body && (
              <p className={clsx('mt-4 text-lg', onNavy ? 'text-white/80' : 'text-ink/70')}>
                {t(c.body, locale)}
              </p>
            )}
            {c.cta?.href && (
              <div className="mt-6">
                <Cta href={c.cta.href} variant={onNavy ? 'amber' : 'navy'}>
                  {t(c.cta.label, locale)}
                </Cta>
              </div>
            )}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
