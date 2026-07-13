'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Container } from '@/components/ui/Section';
import { InlineHtml, RichText } from '@/components/ui/RichText';
import { Cta } from '@/components/ui/Cta';
import { clsx } from '@/lib/clsx';

export interface KineticCta {
  label: string;
  href: string;
  variant?: 'magenta' | 'amber' | 'blue' | 'navy' | 'outline';
  newTab?: boolean;
}

/** Split the keyword strip on middot / comma / pipe / newline into trimmed words. */
function splitWords(marquee?: string): string[] {
  if (!marquee) return [];
  return marquee
    .split(/[·,|\n]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/**
 * "Kinetic Statement" hero: an oversized Bebas headline with a staggered
 * entrance and a looping keyword marquee band beneath it. Rendered inside
 * HeroBlock's navy <Section> (which supplies the optional backdrop), so this
 * component owns only the copy + motion. Honours prefers-reduced-motion.
 */
export function KineticHero({
  eyebrow,
  heading,
  subcopy,
  marquee,
  ctas,
}: {
  eyebrow?: string;
  heading?: string;
  subcopy?: string;
  marquee?: string;
  ctas: KineticCta[];
}) {
  const reduce = useReducedMotion();
  const words = splitWords(marquee);

  // Staggered fade-up: a touch more travel/scale than the standard <Reveal>
  // for hero impact. Collapses to a no-op when reduced motion is requested.
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };
  const item: Variants = reduce
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 26 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      };

  // Marquee speed scales with word count so short and long strips both drift
  // at a readable pace.
  const duration = Math.max(18, words.length * 3.5);

  return (
    <div className="relative z-10 flex min-h-[70vh] flex-col justify-center">
      <Container>
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="max-w-4xl"
        >
          {eyebrow && (
            <motion.div variants={item}>
              <InlineHtml
                as="p"
                html={eyebrow}
                className="font-condensed text-lg uppercase tracking-widest text-cyan"
              />
            </motion.div>
          )}
          <motion.div variants={item}>
            <InlineHtml
              as="h1"
              html={heading}
              fallback="Headline"
              className="mt-3 font-display uppercase leading-[0.9] text-[15vw] [overflow-wrap:anywhere] sm:text-6xl md:text-8xl lg:text-9xl"
            />
          </motion.div>
          {subcopy && (
            <motion.div variants={item}>
              <RichText
                html={subcopy}
                onNavy
                className="mt-6 max-w-xl font-body text-lg text-white/85"
              />
            </motion.div>
          )}
          {ctas.length > 0 && (
            <motion.div variants={item} className="mt-9 flex flex-wrap gap-3">
              {ctas.slice(0, 2).map((cta, i) => (
                <Cta
                  key={i}
                  href={cta.href || '#'}
                  variant={cta.variant || (i === 0 ? 'magenta' : 'outline')}
                  size={i === 0 ? 'lg' : 'md'}
                  newTab={cta.newTab}
                >
                  <InlineHtml as="span" html={cta.label} />
                </Cta>
              ))}
            </motion.div>
          )}
        </motion.div>
      </Container>

      {words.length > 0 && (
        // Full-bleed looping keyword band. Decorative — the headline carries the
        // message — so it is hidden from assistive tech. Reuses the shared
        // marquee keyframes; two copies of the track make the -50% loop seamless.
        <div aria-hidden className="mt-12 overflow-hidden border-y border-white/10 py-4">
          <div
            className={clsx(
              'flex w-max whitespace-nowrap',
              !reduce && 'animate-marquee-left',
            )}
            style={{ ['--marquee-duration' as string]: `${duration}s` }}
          >
            {(reduce ? [words] : [words, words]).flat().map((w, i) => (
              <span
                key={i}
                className="mx-6 font-condensed text-3xl uppercase tracking-wider text-white/25 md:text-4xl"
              >
                {w}
                <span className="ml-6 text-cyan/40">·</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
