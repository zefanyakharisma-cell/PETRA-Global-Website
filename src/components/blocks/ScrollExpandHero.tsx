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
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1920, h: 1080 },
  );

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const video = resolveAutoplayVideo(videoUrl);

  // Reduced motion: skip the scroll takeover entirely — show it expanded.
  useEffect(() => {
    if (reduce) {
      setScrollProgress(1);
      setMediaFullyExpanded(true);
      setShowContent(true);
    }
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;

    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
        setScrollProgress(newProgress);
        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
        setScrollProgress(newProgress);
        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => setTouchStartY(0);

    const handleScroll = () => {
      if (!mediaFullyExpanded) window.scrollTo(0, 0);
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
  }, [scrollProgress, mediaFullyExpanded, touchStartY, reduce]);

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
  const textTranslateX = scrollProgress * (isMobile ? 180 : 150);

  // Cover sizing for the YouTube/Drive iframe. An iframe can't use object-fit,
  // so we size it to the smallest 16:9 rectangle that fully covers the viewport
  // and clip it to the (smaller) media box below. The box is always ≤ viewport,
  // so it's always fully covered — no black bars — reading as a cropped "peek"
  // while small and a full-screen video once expanded.
  const VIDEO_RATIO = 16 / 9;
  const viewportIsWide = viewport.w / viewport.h > VIDEO_RATIO;
  const coverW = viewportIsWide ? viewport.w : viewport.h * VIDEO_RATIO;
  const coverH = viewportIsWide ? viewport.w / VIDEO_RATIO : viewport.h;

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  const isIframeVideo =
    mediaType === 'video' && video && (video.kind === 'youtube' || video.kind === 'drive');
  const isFileVideo = mediaType === 'video' && video && video.kind === 'file';

  return (
    <div ref={sectionRef} className="overflow-x-hidden bg-navy text-white">
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
        <div className="relative flex min-h-[100dvh] w-full flex-col items-center">
          {bgImageUrl && (
            <motion.div
              className="absolute inset-0 z-0 h-full"
              initial={{ opacity: reduce ? 0 : 1 }}
              animate={{ opacity: 1 - scrollProgress }}
              transition={{ duration: 0.1 }}
            >
              {/* Plain <img>: the URL may be any uploaded/pasted host. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bgImageUrl}
                alt=""
                className="h-screen w-screen object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/10" />
            </motion.div>
          )}

          <div className="container relative z-10 mx-auto flex flex-col items-center justify-start">
            <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center">
              <div
                className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-2xl"
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
                      className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
                      style={{ width: `${coverW}px`, height: `${coverH}px` }}
                      frameBorder={0}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    {/* Blocks pointer events so the page scroll drives expansion. */}
                    <div
                      className="absolute inset-0 z-10"
                      style={{ pointerEvents: mediaFullyExpanded ? 'auto' : 'none' }}
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
                ) : (
                  <div className="relative h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterUrl}
                      alt={title || 'Media content'}
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-black/50"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                <div className="relative z-10 mt-4 flex flex-col items-center text-center">
                  {date && (
                    <p
                      className="text-2xl text-cyan"
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="text-center font-medium text-cyan"
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={clsx(
                  'relative z-10 flex w-full flex-col items-center justify-center gap-4 text-center',
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal',
                )}
              >
                <motion.h1
                  className="text-4xl font-bold text-white md:text-5xl lg:text-6xl"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h1>
                <motion.h1
                  className="text-center text-4xl font-bold text-white md:text-5xl lg:text-6xl"
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h1>
              </div>
            </div>

            {overview && (
              <motion.section
                className="flex w-full flex-col px-8 py-10 md:px-16 lg:py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="mx-auto max-w-4xl">
                  <p className="text-lg text-white/85">{overview}</p>
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
