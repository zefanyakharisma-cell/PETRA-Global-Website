import { Section, Container } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';
import type { BlockComponentProps } from './registry.types';

const ACCENT_TEXT: Record<string, string> = {
  magenta: 'text-magenta',
  amber: 'text-amber',
  cyan: 'text-cyan',
  blue: 'text-blue',
  red: 'text-red',
  orange: 'text-orange',
  green: 'text-green',
  yellow: 'text-yellow',
};

/** Structural breather between blocks — blank space, a hairline, or dots. */
export function DividerBlock({ block }: BlockComponentProps) {
  const style = (block.config.style as string) ?? 'line';
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        {style === 'line' && (
          <hr className={clsx('border-0 border-t', onNavy ? 'border-white/15' : 'border-ink/15')} />
        )}
        {style === 'dots' && (
          <div className={clsx('flex justify-center gap-2', ACCENT_TEXT[accent])} aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          </div>
        )}
        {/* style === 'space' renders only the Section's vertical padding. */}
      </Container>
    </Section>
  );
}
