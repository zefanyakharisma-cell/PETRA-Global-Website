import { Link } from '@/i18n/routing';
import { clsx } from '@/lib/clsx';
import type { ReactNode } from 'react';

type Variant = 'magenta' | 'amber' | 'blue' | 'navy' | 'outline';

const VARIANTS: Record<Variant, string> = {
  // Amber needs dark text for contrast.
  amber: 'bg-amber text-ink hover:brightness-95',
  magenta: 'bg-magenta text-white hover:brightness-110',
  blue: 'bg-blue text-white hover:brightness-110',
  navy: 'bg-navy text-white hover:bg-navy-2',
  outline: 'border border-current text-current hover:bg-white/10',
};

/** Imperative CTA button. Use `external` for outbound links (e.g. Admissions). */
export function Cta({
  href,
  children,
  variant = 'magenta',
  external = false,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  external?: boolean;
  className?: string;
}) {
  const cls = clsx(
    'inline-flex items-center justify-center gap-2 rounded-md px-5 py-3',
    'font-condensed text-lg uppercase tracking-wide transition',
    VARIANTS[variant],
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
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
