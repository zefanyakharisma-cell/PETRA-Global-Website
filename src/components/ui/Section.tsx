import type { CSSProperties, ReactNode } from 'react';
import { clsx } from '@/lib/clsx';
import type { BlockBaseConfig } from '@/lib/types';

const BG: Record<string, string> = {
  navy: 'bg-navy text-white',
  // Dark diagonal wash — reads as navy for text purposes (see isDarkBg).
  'navy-gradient': 'bg-gradient-to-br from-navy to-navy-2 text-white',
  paper: 'bg-paper text-ink',
  // Warm off-white, softer than the neutral paper grey.
  'paper-warm': 'bg-[#f6f1e9] text-ink',
  // Decorative light surfaces — the pattern lives in globals.css utility classes.
  mesh: 'bg-mesh text-ink',
  dots: 'bg-dots text-ink',
  'accent-tint': 'bg-white text-ink', // tint applied per-accent below
};

const ACCENT_TINT: Record<string, string> = {
  magenta: 'bg-magenta/5',
  amber: 'bg-amber/10',
  cyan: 'bg-cyan/10',
  blue: 'bg-blue/5',
  red: 'bg-red/5',
  orange: 'bg-orange/10',
  green: 'bg-green/10',
  yellow: 'bg-yellow/10',
};

const SPACING: Record<string, string> = {
  compact: 'py-8 md:py-10',
  normal: 'py-12 md:py-20',
  spacious: 'py-20 md:py-32',
};

/**
 * Top+bottom edge separators. Each is self-contained (clips/masks the section's
 * OWN surface) so it reads against whatever neighbour sits behind it — no need
 * to know the adjacent section's colour. `none` keeps the historic flat edge.
 */
const EDGE: Record<string, string> = {
  none: '',
  angle: '[clip-path:polygon(0_1.25rem,100%_0,100%_calc(100%_-_1.25rem),0_100%)]',
  curve: 'overflow-hidden rounded-t-[2.5rem] rounded-b-[2.5rem]',
  fade: '[mask-image:linear-gradient(to_bottom,transparent,#000_2.5rem,#000_calc(100%_-_2.5rem),transparent)]',
};

/** Corner radius shared by cards/media via the `--card-r` CSS var. */
const RADIUS_LEN: Record<string, string> = {
  sharp: '0px',
  soft: '1rem',
  round: '1.75rem',
};

/** True when a section surface is dark and needs light-on-dark content. */
export function isDarkBg(bg?: string): boolean {
  return bg === 'navy' || bg === 'navy-gradient';
}

/**
 * Card surface classes for the card-based blocks (card grid, feature cards,
 * downloads, events…). `elevated` (default) reproduces the historic white /
 * translucent lift card; the others are opt-in style variants.
 */
export function cardSurface(style: string | undefined, onDark: boolean): string {
  switch (style) {
    case 'flat':
      return onDark ? 'bg-white/10 hover:bg-white/[0.14]' : 'bg-ink/[0.04] hover:bg-ink/[0.07]';
    case 'outlined':
      return clsx('border', onDark ? 'border-white/25 hover:border-white/45' : 'border-ink/15 hover:border-ink/30');
    case 'glass':
      return clsx(
        'border backdrop-blur-md',
        onDark ? 'border-white/15 bg-white/10 hover:bg-white/[0.16]' : 'border-white/50 bg-white/55 shadow-sm hover:bg-white/70',
      );
    case 'elevated':
    default:
      return clsx(
        'border shadow-sm hover:shadow-lift',
        onDark ? 'border-white/15 bg-white/5 hover:border-white/30' : 'border-ink/10 bg-white hover:border-ink/20',
      );
  }
}

/**
 * Section wrapper applying the universal block options — `background`, `spacing`,
 * `edge` and `radius`. Navy is the load-bearing surface only where chosen; paper
 * is the neutral default. `radius` is published as the `--card-r` CSS var so any
 * card/media inside can share one corner radius.
 */
export function Section({
  config,
  children,
  className,
  id,
  as: Tag = 'section',
}: {
  config: BlockBaseConfig;
  children: ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'header' | 'footer';
}) {
  const background = config.background ?? 'paper';
  const spacing = config.spacing ?? 'normal';
  const edge = (config.edge as string) ?? 'none';
  const tint =
    background === 'accent-tint' ? ACCENT_TINT[config.accent ?? 'magenta'] : '';

  // Only publish the var when a non-default radius is chosen, so untouched
  // sections keep the historic 1rem fallback baked into the card classes.
  const style: CSSProperties | undefined =
    config.radius && RADIUS_LEN[config.radius as string]
      ? ({ ['--card-r' as string]: RADIUS_LEN[config.radius as string] } as CSSProperties)
      : undefined;

  return (
    <Tag
      id={id}
      style={style}
      className={clsx(BG[background] ?? BG.paper, tint, SPACING[spacing], EDGE[edge], className)}
    >
      {children}
    </Tag>
  );
}

export function Container({
  children,
  narrow,
  className,
}: {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'mx-auto w-full px-5 md:px-8',
        narrow ? 'max-w-3xl' : 'max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
