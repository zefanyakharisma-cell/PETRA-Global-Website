'use client';

import {
  CHART_SOURCES,
  AGGREGATE_LABELS,
  findSource,
  type ChartAggregate,
  type ChartQuery,
} from '@/lib/chartSources';

/**
 * Cascading Table → Group by → Aggregate → Value picker for the Chart block's
 * database source. Everything is driven by the CHART_SOURCES allowlist, so the
 * editor can only ever build a safe query. Value is a ChartQuery object.
 */
export function ChartSourceField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: ChartQuery | undefined;
  onChange: (v: ChartQuery) => void;
}) {
  const query: ChartQuery = value ?? { table: '', groupBy: '', aggregate: 'count' };
  const source = findSource(query.table);
  const aggregates: ChartAggregate[] = source && source.numeric.length > 0 ? ['count', 'sum', 'avg'] : ['count'];

  const setTable = (table: string) => {
    const s = findSource(table);
    onChange({ table, groupBy: s?.groupBy[0]?.key ?? '', aggregate: 'count', valueColumn: undefined });
  };
  const patch = (p: Partial<ChartQuery>) => onChange({ ...query, ...p });

  const select = 'w-full rounded-md border border-ink/20 px-2.5 py-1.5 text-sm';

  return (
    <div className="block space-y-2">
      <span className="block text-xs font-medium text-ink/70">{label}</span>

      <label className="block">
        <span className="mb-0.5 block text-[11px] uppercase tracking-wide text-ink/40">Table</span>
        <select className={select} value={query.table} onChange={(e) => setTable(e.target.value)}>
          <option value="">— Choose a table —</option>
          {CHART_SOURCES.map((s) => <option key={s.table} value={s.table}>{s.label}</option>)}
        </select>
      </label>

      {source && (
        <>
          <label className="block">
            <span className="mb-0.5 block text-[11px] uppercase tracking-wide text-ink/40">Group by</span>
            <select className={select} value={query.groupBy} onChange={(e) => patch({ groupBy: e.target.value })}>
              {source.groupBy.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-0.5 block text-[11px] uppercase tracking-wide text-ink/40">Aggregate</span>
            <select
              className={select}
              value={query.aggregate}
              onChange={(e) => {
                const aggregate = e.target.value as ChartAggregate;
                patch({ aggregate, valueColumn: aggregate === 'count' ? undefined : (query.valueColumn ?? source.numeric[0]?.key) });
              }}
            >
              {aggregates.map((a) => <option key={a} value={a}>{AGGREGATE_LABELS[a]}</option>)}
            </select>
          </label>

          {query.aggregate !== 'count' && source.numeric.length > 0 && (
            <label className="block">
              <span className="mb-0.5 block text-[11px] uppercase tracking-wide text-ink/40">Value column</span>
              <select className={select} value={query.valueColumn ?? ''} onChange={(e) => patch({ valueColumn: e.target.value })}>
                {source.numeric.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </label>
          )}
        </>
      )}
      {help && <span className="block text-[11px] text-ink/40">{help}</span>}
    </div>
  );
}
