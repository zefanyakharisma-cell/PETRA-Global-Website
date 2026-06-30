import type { ReactNode } from 'react';
import { clsx } from '@/lib/clsx';
import type { BlockBaseConfig } from '@/lib/types';

const BG: Record<string, string> = {
  navy: 'bg-navy text-white',
  paper: 'bg-paper text-ink',
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
 * Section wrapper applying the two universal block options — `background` and
 * `spacing` — so every block stays structurally on-brand. Navy is the default
 * load-bearing surface only where chosen; paper is the neutral default.
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
  const tint =
    background === 'accent-tint' ? ACCENT_TINT[config.accent ?? 'magenta'] : '';

  return (
    <Tag id={id} className={clsx(BG[background], tint, SPACING[spacing], className)}>
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
