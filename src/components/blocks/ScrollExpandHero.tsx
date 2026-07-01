'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { clsx } from '@/lib/clsx';
import { resolveAutoplayVideo } from '@/lib/media';

export interface ScrollExpandHeroProps {
  mediaType?: 'video' | 'image';
  /** Video URL: YouTube link, Google Drive share link, or a direct .mp4 URL. */
  videoUrl?: string;
  /** Poster shown before a direct video loads; also the displayed image in image mode. */
  posterUrl?: string;
  /** Full-bleed background image behind the expanding media. */
  bgImageUrl?: string;
  title?: string;
  /** Small caption above the scroll hint (originally "date"). */
  date?: string;
  /** Scroll-to-expand hint text. */
  scrollToExpand?: string;
  /** Blend the title with the background using mix-blend-difference. */
  textBlend?: boolean;
  /** Body copy revealed once the media is fully expanded. */
  overview?: string;
}

/**
 * Scroll-to-expand hero. On wheel/touch the centred media grows from a card to a
 * near-full-bleed panel; once fully expanded the page unlocks and the body copy
 * fades in. Supports YouTube, Google Drive, direct video, and static images.
 * Honours prefers-reduced-motion by rendering the expanded state without
 * hijacking scroll.
 */
export default function ScrollExpandHero({
  mediaType = 'video',
  videoUrl,
  posterUrl,
  bgImageUrl,
  title,
  date,
  scrollToExpand,
  textBlend,
  overview,
}: ScrollExpandHeroProps) {
  const reduce = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // SSR-safe default so server and first client render agree (no hydration
  // mismatch on the iframe's inline size); the resize effect sets real values.
  const [viewport, setViewport] = useState({ w: 1920, h: 1080 });

  const video = resolveAutoplayVideo(videoUrl);

  // Refs mirror the interactive state so the window listeners can read the
  // latest values while being bound only once (binding them per-frame thrashes
  // add/removeEventListener and causes scroll jank).
  const progressRef = useRef(0);
  const expandedRef = useRef(false);
  const touchStartRef = useRef(0);

  // Reduced motion: skip the scroll takeover entirely — show it expanded.
  useEffect(() => {
    if (reduce) {
      setScrollProgress(1);
      setMediaFullyExpanded(true);
    }
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;

    const applyProgress = (next: number) => {
      const clamped = Math.min(Math.max(next, 0), 1);
      progressRef.current = clamped;
      setScrollProgress(clamped);
      if (clamped >= 1) {
        expandedRef.current = true;
        setMediaFullyExpanded(true);
      }
    };

    const collapse = () => {
      expandedRef.current = false;
      setMediaFullyExpanded(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (expandedRef.current && e.deltaY < 0 && window.scrollY <= 5) {
        collapse();
        e.preventDefault();
      } else if (!expandedRef.current) {
        e.preventDefault();
        applyProgress(progressRef.current + e.deltaY * 0.0009);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartRef.current - touchY;

      if (expandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        collapse();
        e.preventDefault();
      } else if (!expandedRef.current) {
        e.preventDefault();
        const factor = deltaY < 0 ? 0.008 : 0.005;
        applyProgress(progressRef.current + deltaY * factor);
        touchStartRef.current = touchY;
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = 0;
    };

    // While collapsed the hero owns the viewport — keep the page pinned to top.
    const handleScroll = () => {
      if (!expandedRef.current) window.scrollTo(0, 0);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [reduce]);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobile ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobile ? 200 : 400);
  // Reduced motion renders the expanded state statically, so keep the title
  // centred (a non-zero translate here would fling it off-screen).
  const textTranslateX = reduce ? 0 : scrollProgress * (isMobile ? 180 : 150);

  // Cover sizing for the YouTube/Drive iframe. An iframe can't use object-fit,
  // so we size it to the smallest 16:9 rectangle that fully covers the viewport
  // and clip it to the (smaller) media box below. The box is always ≤ viewport,
  // so it's always fully covered — no black bars — reading as a cropped "peek"
  // while small and a full-screen video once expanded.
  const VIDEO_RATIO = 16 / 9;
  const viewportIsWide = viewport.w / viewport.h > VIDEO_RATIO;
  const coverW = viewportIsWide ? viewport.w : viewport.h * VIDEO_RATIO;
  const coverH = viewportIsWide ? viewport.w / VIDEO_RATIO : viewport.h;

  const words = title?.trim() ? title.trim().split(' ') : [];
  const firstWord = words[0] ?? '';
  const restOfTitle = words.slice(1).join(' ');

  const isIframeVideo =
    mediaType === 'video' && video?.kind !== undefined && video.kind !== 'file';
  const isFileVideo = mediaType === 'video' && video?.kind === 'file';
  const isImage = !isIframeVideo && !isFileVideo && !!posterUrl;

  return (
    <div className="overflow-x-hidden bg-navy text-white">
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
        <div className="relative flex min-h-[100dvh] w-full flex-col items-center">
          {bgImageUrl && (
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: reduce ? 0 : 1 }}
              animate={{ opacity: 1 - scrollProgress }}
              transition={{ duration: 0.1 }}
            >
              {/* Plain <img>: the URL may be any uploaded/pasted host. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bgImageUrl}
                alt=""
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/10" />
            </motion.div>
          )}

          <div className="container relative z-10 mx-auto flex flex-col items-center justify-start">
            <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center">
              <div
                className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
                }}
              >
                {isIframeVideo ? (
                  <div className="relative h-full w-full overflow-hidden rounded-xl">
                    {/* Sized to cover the viewport and centred, then clipped by the
                        parent's overflow-hidden — the iframe equivalent of object-cover. */}
                    <iframe
                      src={video!.src}
                      className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
                      style={{ width: `${coverW}px`, height: `${coverH}px` }}
                      frameBorder={0}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <motion.div
                      className="pointer-events-none absolute inset-0 bg-black/30"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                ) : isFileVideo ? (
                  <div className="relative h-full w-full">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      src={video!.src}
                      poster={posterUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      controls={false}
                      disablePictureInPicture
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-xl bg-black/30"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                ) : isImage ? (
                  <div className="relative h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterUrl}
                      alt={title || 'Media content'}
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-xl bg-black/50"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                ) : (
                  // No media configured yet — a neutral panel beats a broken <img>.
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-navy to-ink" />
                )}
              </div>

              {/* Eyebrow → Header → Sub-header as one centred stack over the media.
                  The header keeps its split fling-apart animation; the eyebrow and
                  sub-header stay centred so they remain readable. Every element
                  carries a text-shadow so the copy stays legible over any video —
                  bright, busy, or light-coloured footage included. */}
              <div className="pointer-events-none relative z-10 flex w-full max-w-4xl flex-col items-center gap-4 px-4 text-center">
                {date && (
                  <p className="font-condensed text-sm uppercase tracking-[0.25em] text-cyan drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)] md:text-base">
                    {date}
                  </p>
                )}

                {firstWord && (
                  <h1
                    className={clsx(
                      'flex w-full flex-col items-center justify-center gap-2 text-4xl font-bold text-white md:text-5xl lg:text-6xl',
                      textBlend
                        ? 'mix-blend-difference'
                        : 'mix-blend-normal drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]',
                    )}
                  >
                    <motion.span style={{ transform: `translateX(-${textTranslateX}vw)` }}>
                      {firstWord}
                    </motion.span>
                    {restOfTitle && (
                      <motion.span style={{ transform: `translateX(${textTranslateX}vw)` }}>
                        {restOfTitle}
                      </motion.span>
                    )}
                  </h1>
                )}

                {overview && (
                  <p className="max-w-2xl font-body text-base text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] md:text-lg">
                    {overview}
                  </p>
                )}

                {scrollToExpand && (
                  <motion.p
                    className="mt-2 text-sm font-medium text-cyan drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]"
                    animate={{ opacity: mediaFullyExpanded ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {scrollToExpand}
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
