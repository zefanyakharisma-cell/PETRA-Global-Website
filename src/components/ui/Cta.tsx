import { Link } from '@/i18n/routing';
import { clsx } from '@/lib/clsx';
import type { ReactNode } from 'react';

type Variant = 'magenta' | 'amber' | 'blue' | 'navy' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // Amber needs dark text for contrast.
  amber: 'bg-amber text-ink hover:brightness-95',
  magenta: 'bg-magenta text-white hover:brightness-110',
  blue: 'bg-blue text-white hover:brightness-110',
  navy: 'bg-navy text-white hover:bg-navy-2',
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
    'inline-flex items-center justify-center gap-2 rounded-md',
    'font-condensed uppercase tracking-wide transition',
    SIZES[size],
    VARIANTS[variant],
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
