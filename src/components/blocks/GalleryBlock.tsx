'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';
import type { BlockComponentProps } from './registry.types';

interface GalleryImage {
  url: string;
  alt?: string;
}

interface GalleryContent {
  images?: GalleryImage[];
}

// Varied aspect ratios fake a masonry rhythm while keeping next/image's fill.
const MASONRY_ASPECT = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/5]'];

/** Image grid with a lightbox. Grid / masonry / carousel layouts. */
export function GalleryBlock({ block }: BlockComponentProps) {
  const c = block.content as GalleryContent;
  const images = c.images ?? [];
  const columns = Number(block.config.columns ?? 3);
  const layout = (block.config.layout as string) ?? 'grid';
  const [active, setActive] = useState<number | null>(null);

  const Tile = ({ i, className }: { i: number; className?: string }) => {
    const img = images[i];
    return (
      <button
        type="button"
        onClick={() => setActive(i)}
        className={clsx('group relative overflow-hidden rounded-lg bg-ink/5', className)}
      >
        <Image
          src={img.url}
          alt={img.alt ?? ''}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-navy/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="text-3xl text-white/90">⤢</span>
        </span>
      </button>
    );
  };

  return (
    <Section config={block.config}>
      <Container>
        {layout === 'masonry' ? (
          <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
            {images.map((_, i) => (
              <Tile key={i} i={i} className={clsx('block w-full break-inside-avoid', MASONRY_ASPECT[i % MASONRY_ASPECT.length])} />
            ))}
          </div>
        ) : layout === 'carousel' ? (
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {images.map((_, i) => (
              <Tile key={i} i={i} className="aspect-[4/3] min-w-[78%] shrink-0 snap-start sm:min-w-[46%] lg:min-w-[31%]" />
            ))}
          </div>
        ) : (
          <div
            className={clsx(
              'grid gap-3',
              columns === 2 && 'grid-cols-2',
              columns === 3 && 'grid-cols-2 sm:grid-cols-3',
              columns >= 4 && 'grid-cols-2 sm:grid-cols-4',
            )}
          >
            {images.map((_, i) => (
              <Tile key={i} i={i} className="aspect-square" />
            ))}
          </div>
        )}
      </Container>

      {active !== null && images[active] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 p-6 backdrop-blur-sm animate-fade-up"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition-colors hover:bg-white/20"
            onClick={() => setActive(null)}
          >
            ×
          </button>
          <div className="relative h-[80vh] w-full max-w-4xl">
            <Image src={images[active].url} alt={images[active].alt ?? ''} fill className="object-contain" />
          </div>
        </div>
      )}
    </Section>
  );
}
