'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';
import { resolveEmbed, youtubeId } from '@/lib/media';
import type { BlockComponentProps } from './registry.types';

interface GalleryItem {
  url?: string;
  /** Optional video: an uploaded file URL, or a YouTube / Google Drive link. */
  video?: string;
  /** Doubles as the alt text and the on-tile / lightbox caption. */
  alt?: string;
}

interface GalleryContent {
  images?: GalleryItem[];
}

// Varied aspect ratios fake a masonry rhythm while keeping next/image's fill.
const MASONRY_ASPECT = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/5]'];

/** Poster for a tile: explicit image, else a YouTube thumbnail derived from the video. */
function posterFor(item: GalleryItem): string | null {
  if (item.url) return item.url;
  const yt = item.video ? youtubeId(item.video) : null;
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
}

/**
 * Media grid with a lightbox — images and videos. Grid / masonry / carousel
 * layouts. Video tiles (uploaded file, YouTube, or Google Drive) show a play
 * badge and open a player in the lightbox; images open at full size. Optional
 * captions sit neatly beneath each tile.
 */
export function GalleryBlock({ block }: BlockComponentProps) {
  const c = block.content as GalleryContent;
  const items = (c.images ?? []).filter((it) => it.url || it.video);
  const columns = Number(block.config.columns ?? 3);
  const layout = (block.config.layout as string) ?? 'grid';
  const onNavy = block.config.background === 'navy';
  const [active, setActive] = useState<number | null>(null);

  const Tile = ({ i, className }: { i: number; className?: string }) => {
    const item = items[i];
    const poster = posterFor(item);
    const isVideo = !!item.video;
    return (
      <figure className={clsx('group flex flex-col', layout === 'masonry' && 'break-inside-avoid')}>
        <button
          type="button"
          onClick={() => setActive(i)}
          aria-label={item.alt || (isVideo ? 'Play video' : 'View image')}
          className={clsx('relative w-full overflow-hidden rounded-xl bg-ink/5 ring-1 ring-ink/5', className)}
        >
          {poster ? (
            <Image
              src={poster}
              alt={item.alt ?? ''}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center bg-navy/90 text-4xl text-white/80">▶</span>
          )}
          <span
            className={clsx(
              'pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300',
              isVideo ? 'bg-navy/25 opacity-100' : 'bg-navy/40 opacity-0 group-hover:opacity-100',
            )}
          >
            <span className={clsx(
              'flex items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-300 group-hover:scale-110',
              isVideo ? 'h-14 w-14 bg-white/90 text-2xl text-navy shadow-lg' : 'text-3xl text-white/90',
            )}>
              {isVideo ? '▶' : '⤢'}
            </span>
          </span>
        </button>
        {item.alt && (
          <figcaption className={clsx('mt-2 text-sm leading-snug', onNavy ? 'text-white/60' : 'text-ink/55')}>
            {item.alt}
          </figcaption>
        )}
      </figure>
    );
  };

  const activeItem = active !== null ? items[active] : null;

  return (
    <Section config={block.config}>
      <Container>
        {layout === 'masonry' ? (
          <div className="columns-2 gap-4 sm:columns-3 [&>*]:mb-4">
            {items.map((_, i) => (
              <Tile key={i} i={i} className={clsx('block w-full', MASONRY_ASPECT[i % MASONRY_ASPECT.length])} />
            ))}
          </div>
        ) : layout === 'carousel' ? (
          <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
            {items.map((_, i) => (
              <div key={i} className="min-w-[78%] shrink-0 snap-start sm:min-w-[46%] lg:min-w-[31%]">
                <Tile i={i} className="aspect-[4/3]" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={clsx(
              'grid gap-4',
              columns === 2 && 'grid-cols-1 sm:grid-cols-2',
              columns === 3 && 'grid-cols-2 sm:grid-cols-3',
              columns >= 4 && 'grid-cols-2 sm:grid-cols-4',
            )}
          >
            {items.map((_, i) => (
              <Tile key={i} i={i} className="aspect-square" />
            ))}
          </div>
        )}
      </Container>

      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-navy/90 p-6 backdrop-blur-sm animate-fade-up"
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
          <div
            className="relative flex w-full max-w-5xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Lightbox item={activeItem} />
          </div>
          {activeItem.alt && (
            <p className="max-w-2xl text-center text-sm text-white/70">{activeItem.alt}</p>
          )}
        </div>
      )}
    </Section>
  );
}

/** Renders the enlarged media: iframe for YouTube/Drive, <video> for files, else the image. */
function Lightbox({ item }: { item: GalleryItem }) {
  if (item.video) {
    const embed = resolveEmbed(item.video);
    if (embed && embed.kind !== 'iframe') {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          <iframe
            src={embed.kind === 'youtube' ? `${embed.src}&autoplay=1` : embed.src}
            title={item.alt || 'Video'}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <video
        src={item.video}
        poster={item.url || undefined}
        controls
        autoPlay
        playsInline
        className="max-h-[80vh] w-full rounded-2xl bg-black shadow-2xl"
      />
    );
  }
  return (
    <div className="relative h-[80vh] w-full">
      <Image src={item.url ?? ''} alt={item.alt ?? ''} fill className="object-contain" />
    </div>
  );
}
