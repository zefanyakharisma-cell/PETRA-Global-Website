'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from '@/lib/clsx';

/**
 * Sticky site header. Sits flush and solid at the very top of the page, then
 * gains a translucent frosted backdrop, hairline border, and soft shadow once
 * the page scrolls — the navbar's signature moment. Scroll-elevation pattern
 * from 21st.dev "Header 1" (efferd), rebuilt around our bespoke nav markup.
 *
 * Skipped: hide-on-scroll-down — the nav is shallow and always-visible aids
 * wayfinding on a content site. Add it if the header ever grows tall.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // honour a mid-page load / refresh
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 text-white transition-[background-color,border-color,box-shadow] duration-300 ease-out',
        scrolled
          ? 'border-b border-white/10 bg-navy/80 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-navy/70'
          : 'border-b border-transparent bg-navy',
      )}
    >
      {children}
    </header>
  );
}
