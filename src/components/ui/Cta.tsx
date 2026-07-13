import { Link } from '@/i18n/routing';
import { clsx } from '@/lib/clsx';
import type { ReactNode } from 'react';

type Variant = 'magenta' | 'amber' | 'blue' | 'navy' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // Amber needs dark text for contrast. Solid variants gain a soft resting
  // shadow that deepens on hover; outline stays flat and fills subtly.
  amber: 'bg-amber text-ink shadow-sm hover:brightness-95 hover:shadow-lift',
  magenta: 'bg-magenta text-white shadow-sm hover:brightness-110 hover:shadow-lift',
  blue: 'bg-blue text-white shadow-sm hover:brightness-110 hover:shadow-lift',
  navy: 'bg-navy text-white shadow-sm hover:bg-navy-2 hover:shadow-lift',
  outline: 'border border-current text-current hover:bg-white/10',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-base',
  md: 'px-5 py-3 text-lg',
  lg: 'px-7 py-4 text-xl',
};

/** href forms that must render as a plain <a> rather than the locale <Link>. */
function isProtocolHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('#');
}

/**
 * Imperative CTA button. Detects external / protocol links (http, mailto, tel)
 * and same-page anchors automatically, so editors just pick a link type; pass
 * `newTab` to open in a new tab. `external` is kept for callers that force it.
 */
export function Cta({
  href,
  children,
  variant = 'magenta',
  size = 'md',
  external = false,
  newTab = false,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  external?: boolean;
  newTab?: boolean;
  className?: string;
}) {
  const cls = clsx(
    'relative overflow-hidden',
    'inline-flex items-center justify-center gap-2 rounded-md',
    'font-condensed uppercase tracking-wide',
    'transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:brightness-95',
    SIZES[size],
    VARIANTS[variant],
    // Shine sweep on hover — a soft skewed light bar glides across solid fills.
    // Skipped on outline (no surface to catch the light). Adapted from 21st.dev
    // "Shining Button" (hextaui); reduced-motion neutralises the transition.
    variant !== 'outline' &&
      'before:pointer-events-none before:absolute before:top-0 before:h-[200%] before:w-10 before:-translate-x-[6rem] before:-skew-x-12 before:bg-white/25 before:blur-md before:transition-transform before:duration-700 before:ease-out hover:before:translate-x-[22rem]',
    className,
  );

  const useAnchor = external || isProtocolHref(href);
  const openNew = newTab || external;

  if (useAnchor) {
    return (
      <a href={href} className={cls} {...(openNew ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
