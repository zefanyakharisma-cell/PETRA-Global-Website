'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { clsx } from '@/lib/clsx';

export interface HeroSlide {
  image_url: string;
  title?: string;
  href?: string;
}

/**
 * Auto-rotating full-bleed background for the hero. Crossfades between entity
 * cover images (programs / news), pausing on prefers-reduced-motion. Renders its
 * own navy scrim + controls so layering stays correct; dots/caption sit above
 * the scrim. Kept presentational — the server block resolves the slides.
 */
export function HeroCarousel({ slides, interval = 6000 }: { slides: HeroSlide[]; interval?: number }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(id);
  }, [reduce, slides.length, interval]);

  if (slides.length === 0) return null;
  const current = slides[index % slides.length];

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <Image
            src={current.image_url}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navy scrim keeps the hero copy legible over any image. */}
      <div className="absolute inset-0 bg-navy/70" />

      {/* Caption for the current slide (bottom-left). */}
      {current.title && (
        <div className="pointer-events-none absolute bottom-5 left-5 z-20 max-w-[60%]">
          {current.href ? (
            <Link
              href={current.href}
              className="pointer-events-auto inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              {current.title}
            </Link>
          ) : (
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20 backdrop-blur">
              {current.title}
            </span>
          )}
        </div>
      )}

      {/* Dots (bottom-right) — jump between slides. */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 right-5 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={clsx(
                'h-2 w-2 rounded-full transition',
                i === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}
