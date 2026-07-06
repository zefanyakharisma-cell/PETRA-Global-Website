'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Animated figure for the StatStrip. Counts from zero up to the numeric part of
 * `value` when it first scrolls into view, preserving any surrounding text
 * (prefix/suffix like "+", "%", "K", or a leading symbol) and the source
 * formatting (thousands separators are re-applied while counting).
 *
 * Values with no digits (e.g. "—") render verbatim. Honours
 * prefers-reduced-motion by rendering the final value immediately.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>(() => value);

  // Split into [prefix][number][suffix]. If there is no number, we never animate.
  const match = value.match(/^(\D*?)([\d][\d.,]*)(.*)$/s);
  const prefix = match?.[1] ?? '';
  const rawNumber = match?.[2] ?? '';
  const suffix = match?.[3] ?? '';
  const grouped = rawNumber.includes(',');
  const decimals = rawNumber.includes('.') ? (rawNumber.split('.')[1]?.length ?? 0) : 0;
  const target = match ? parseFloat(rawNumber.replace(/,/g, '')) : NaN;

  useEffect(() => {
    if (!match || Number.isNaN(target)) {
      setDisplay(value);
      return;
    }
    const format = (n: number) => {
      const fixed = n.toFixed(decimals);
      const str = grouped ? Number(fixed).toLocaleString('en-US', { minimumFractionDigits: decimals }) : fixed;
      return `${prefix}${str}${suffix}`;
    };

    if (reduce) {
      setDisplay(format(target));
      return;
    }

    setDisplay(format(0));
    const node = ref.current;
    if (!node) return;

    let raf = 0;
    let started = false;
    const duration = 1400;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        // easeOutExpo — fast then settling, reads as "counting up and landing".
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(format(target * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
