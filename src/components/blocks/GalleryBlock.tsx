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

/** Image grid with a lightbox. Columns configurable. */
export function GalleryBlock({ block }: BlockComponentProps) {
  const c = block.content as GalleryContent;
  const images = c.images ?? [];
  const columns = Number(block.config.columns ?? 3);
  const [active, setActive] = useState<number | null>(null);

  return (
    <Section config={block.config}>
      <Container>
        <div
          className={clsx(
            'grid gap-3',
            columns === 2 && 'grid-cols-2',
            columns === 3 && 'grid-cols-2 sm:grid-cols-3',
            columns >= 4 && 'grid-cols-2 sm:grid-cols-4',
          )}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className="relative aspect-square overflow-hidden rounded-lg bg-ink/5"
            >
              <Image src={img.url} alt={img.alt ?? ''} fill className="object-cover transition hover:scale-105" />
            </button>
          ))}
        </div>
      </Container>

      {active !== null && images[active] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 p-6"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-5 top-5 text-3xl text-white"
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
