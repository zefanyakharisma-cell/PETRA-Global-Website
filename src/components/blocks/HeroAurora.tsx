'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Animated aurora backdrop for the Hero, adapted to the PETRA navy palette.
 * Two blurred, slowly drifting brand-accent gradient layers sit over the
 * navy Section surface; a radial vignette fades the edges back to navy so the
 * white hero copy (lifted to z-10 in HeroBlock) stays legible.
 *
 * Technique adapted from a 21st.dev aurora hero, re-brandored to blue/cyan/
 * magenta and made dependency-free (framer-motion only). Honours
 * prefers-reduced-motion — the animation collapses to a static wash.
 */
export function HeroAurora() {
  const reduce = useReducedMotion();

  // Brand accents over navy. Kept desaturated-by-blur so it reads as a glow,
  // never a garish rainbow. Order cycles cool -> warm -> cool for a seam-free loop.
  const auroraGradient = `repeating-linear-gradient(100deg,
    #3880d0 10%,
    #245484 15%,
    #54feeb 20%,
    #ec008c 25%,
    #3880d0 30%)`;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Primary drifting glow. */}
      <motion.div
        className="absolute inset-[-100%] opacity-45"
        style={{
          background: auroraGradient,
          backgroundSize: '300% 100%',
          filter: 'blur(90px)',
        }}
        animate={reduce ? undefined : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />
      {/* Counter-moving layer adds depth and keeps the motion from looking flat. */}
      <motion.div
        className="absolute inset-[-100%] opacity-25 mix-blend-screen"
        style={{
          background: auroraGradient,
          backgroundSize: '200% 100%',
          filter: 'blur(70px)',
        }}
        animate={reduce ? undefined : { backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      {/* Vignette back to navy: darkens edges + bottom so copy and the scroll cue stay readable. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 30%, transparent 0%, rgba(19,50,86,0.35) 55%, rgba(19,50,86,0.9) 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy to-transparent" />
    </div>
  );
}
