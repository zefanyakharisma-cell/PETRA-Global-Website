import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface Logo {
  url: string;
  name?: string;
  href?: string;
}

interface LogoWallContent {
  heading?: LocaleMap;
  logos?: Logo[];
}

/** Partner / accreditation logos (ACUCA, IFACHE). Grayscale or color. */
export function LogoWallBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as LogoWallContent;
  const logos = c.logos ?? [];
  const grayscale = (block.config.style as string) !== 'color';
  const columns = Number(block.config.columns ?? 4);

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'paper' }}>
      <Container>
        {c.heading && (
          <p className="mb-8 text-center font-condensed text-lg uppercase tracking-widest text-ink/50">
            {t(c.heading, locale)}
          </p>
        )}
        <div
          className={clsx(
            'grid items-center gap-8',
            columns <= 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
          )}
        >
          {logos.map((logo, i) => {
            const img = (
              <div className="relative mx-auto h-16 w-full max-w-[160px]">
                <Image
                  src={logo.url}
                  alt={logo.name ?? ''}
                  fill
                  className={clsx('object-contain transition', grayscale && 'opacity-70 grayscale hover:opacity-100 hover:grayscale-0')}
                />
              </div>
            );
            return logo.href ? (
              <a key={i} href={logo.href} target="_blank" rel="noopener noreferrer">{img}</a>
            ) : (
              <div key={i}>{img}</div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
