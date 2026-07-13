'use client';

import { useEffect, useRef } from 'react';

/**
 * Pointer-tracking spotlight — the "signature moment" for the card family.
 * Drop it as the FIRST child of any `relative overflow-hidden` container; on
 * mount it binds to its parent and paints a soft brand-tinted glow that follows
 * the cursor, fading in on hover. Writes CSS custom properties on itself via a
 * ref (never setState) so a moving pointer re-paints without re-rendering the
 * card's image/text subtree. Adapted from 21st.dev "Spotlight Card" (hextaui).
 *
 * Skipped: touch/coarse-pointer handling — the glow is a hover affordance and
 * simply never fires without a pointer. Add a tap-pulse if mobile delight is
 * wanted later.
 */
export function SpotlightOverlay({ hue = 'magenta' }: { hue?: 'magenta' | 'cyan' }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const move = (e: MouseEvent) => {
      const r = parent.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
      el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
    };
    const enter = () => el.style.setProperty('--spot-o', '1');
    const leave = () => el.style.setProperty('--spot-o', '0');

    parent.addEventListener('mousemove', move);
    parent.addEventListener('mouseenter', enter);
    parent.addEventListener('mouseleave', leave);
    return () => {
      parent.removeEventListener('mousemove', move);
      parent.removeEventListener('mouseenter', enter);
      parent.removeEventListener('mouseleave', leave);
    };
  }, []);

  // Brand accents only — magenta on light surfaces, cyan on navy.
  const color = hue === 'cyan' ? 'rgba(84,254,235,0.16)' : 'rgba(236,0,140,0.14)';

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-500 ease-out"
      style={{
        opacity: 'var(--spot-o, 0)',
        background: `radial-gradient(16rem 16rem at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 70%)`,
      }}
    />
  );
}
