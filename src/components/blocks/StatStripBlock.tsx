import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface Stat {
  value?: string;
  label?: LocaleMap;
  /** When set, the value auto-counts from an entity table instead of `value`. */
  auto?: 'partners' | 'partners_international' | 'programs' | 'none';
}

interface StatStripContent {
  stats?: Stat[];
}

/** "Petra at a Glance." Manual values, or auto-counts from entity tables. */
export async function StatStripBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as StatStripContent;
  const stats = c.stats ?? [];
  const onNavy = (block.config.background ?? 'navy') === 'navy';

  // Resolve any auto-count stats with a single pass of cheap head counts.
  const needsCounts = stats.some((s) => s.auto && s.auto !== 'none');
  let counts = { partners: 0, partners_international: 0, programs: 0 };
  if (needsCounts) {
    const supabase = await createClient();
    const [p, pi, pr] = await Promise.all([
      supabase.from('partners').select('*', { count: 'exact', head: true }),
      supabase.from('partners').select('*', { count: 'exact', head: true }).eq('kind', 'international'),
      supabase.from('programs').select('*', { count: 'exact', head: true }),
    ]);
    counts = {
      partners: p.count ?? 0,
      partners_international: pi.count ?? 0,
      programs: pr.count ?? 0,
    };
  }

  const resolve = (s: Stat) =>
    s.auto && s.auto !== 'none' ? String(counts[s.auto] ?? 0) : (s.value ?? '—');

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container>
        <dl
          className={clsx(
            'grid gap-8 text-center',
            stats.length <= 2 && 'grid-cols-2',
            stats.length === 3 && 'grid-cols-1 sm:grid-cols-3',
            stats.length >= 4 && 'grid-cols-2 md:grid-cols-4',
          )}
        >
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div>
                <dd className={clsx('text-5xl md:text-6xl', onNavy ? 'text-cyan' : 'text-magenta')}>
                  {resolve(s)}
                </dd>
                <dt className={clsx('mt-2 font-condensed uppercase tracking-wide', onNavy ? 'text-white/75' : 'text-ink/60')}>
                  {t(s.label, locale)}
                </dt>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
