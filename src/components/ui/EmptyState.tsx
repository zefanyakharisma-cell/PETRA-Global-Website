import { clsx } from '@/lib/clsx';

/**
 * On-brand empty state for entity-bound blocks before content is seeded.
 * Per the client brief: ship robust empty states, do not seed real content.
 */
export function EmptyState({
  title,
  hint,
  onDark = false,
}: {
  title: string;
  hint?: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-dashed px-6 py-12 text-center',
        onDark ? 'border-white/25 text-white/80' : 'border-ink/15 text-ink/60',
      )}
    >
      <p className="font-condensed text-xl uppercase tracking-wide">{title}</p>
      {hint && <p className="mt-2 text-sm">{hint}</p>}
    </div>
  );
}
