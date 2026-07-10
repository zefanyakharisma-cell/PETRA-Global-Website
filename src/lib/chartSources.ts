/**
 * Allowlist of database sources the Chart block can aggregate over, plus the
 * pure aggregation helper. This is the guard-rail for the "pull from database"
 * source: the editor only ever picks a table + column from this list, and the
 * server only ever `select`s allowlisted column names — no arbitrary SQL and no
 * raw schema exposure.
 *
 * This module is isomorphic (no server-only imports) so registry.meta + the
 * editor field can read CHART_SOURCES on the client, while ChartBlock (server)
 * passes it a Supabase client to run the query.
 */

export type ChartAggregate = 'count' | 'sum' | 'avg';

export interface ChartColumn {
  key: string;
  label: string;
}

export interface ChartSource {
  /** petra_io table name. */
  table: string;
  label: string;
  /** Text / enum columns rows can be grouped by. */
  groupBy: ChartColumn[];
  /** Numeric columns available for sum / avg. `count` never needs one. */
  numeric: ChartColumn[];
}

/** The persisted query config (block.config.dbQuery). */
export interface ChartQuery {
  table: string;
  groupBy: string;
  aggregate: ChartAggregate;
  /** Required for sum / avg; ignored for count. */
  valueColumn?: string;
}

/**
 * Curated, safe sources. Only tables/columns listed here can ever be queried.
 * Row counts are small (≤ ~450) so we fetch the grouped column and tally in JS
 * (mirrors StatStripBlock's approach) — no Postgres GROUP BY needed.
 */
export const CHART_SOURCES: ChartSource[] = [
  {
    table: 'partners',
    label: 'International partners',
    groupBy: [
      { key: 'country', label: 'Country' },
      { key: 'kind', label: 'Type (intl / domestic)' },
      { key: 'region', label: 'Region' },
    ],
    numeric: [],
  },
  {
    table: 'domestic_partners',
    label: 'Domestic partners',
    groupBy: [
      { key: 'region', label: 'Region' },
      { key: 'city', label: 'City' },
    ],
    numeric: [],
  },
  {
    table: 'programs',
    label: 'Programs',
    groupBy: [{ key: 'kind', label: 'Kind (inbound / outbound)' }],
    numeric: [],
  },
  {
    table: 'study_programs',
    label: 'Study programs',
    groupBy: [{ key: 'degree', label: 'Degree' }],
    numeric: [],
  },
  {
    table: 'courses',
    label: 'Courses',
    groupBy: [
      { key: 'area', label: 'Area' },
      { key: 'semester', label: 'Semester' },
    ],
    numeric: [{ key: 'credits', label: 'Credits' }],
  },
  {
    table: 'testimonials',
    label: 'Testimonials',
    groupBy: [{ key: 'country', label: 'Country' }],
    numeric: [],
  },
  {
    table: 'inquiries',
    label: 'Inquiries',
    groupBy: [
      { key: 'kind', label: 'Kind' },
      { key: 'status', label: 'Status' },
    ],
    numeric: [],
  },
];

export const AGGREGATE_LABELS: Record<ChartAggregate, string> = {
  count: 'Count of rows',
  sum: 'Sum of a value',
  avg: 'Average of a value',
};

export function findSource(table: string | undefined): ChartSource | undefined {
  return CHART_SOURCES.find((s) => s.table === table);
}

/** Normalised chart dataset — column 0 is the category, the rest are series. */
export interface ChartData {
  headers: string[];
  rows: (string | number)[][];
}

/** Minimal shape of the Supabase query builder we rely on (kept server-agnostic). */
interface AggregateClient {
  from(table: string): {
    select(columns: string): PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>;
  };
}

const MAX_CATEGORIES = 20;

/**
 * Run an allowlisted aggregation and return a normalised {headers, rows} dataset
 * ready for the chart. Invalid table/column requests resolve to empty data
 * (never an error) so a mis-configured block degrades to an empty state.
 */
export async function aggregate(client: AggregateClient, query: ChartQuery | undefined): Promise<ChartData> {
  const source = findSource(query?.table);
  if (!query || !source) return { headers: [], rows: [] };

  const groupCol = source.groupBy.find((c) => c.key === query.groupBy);
  if (!groupCol) return { headers: [], rows: [] };

  const agg = query.aggregate ?? 'count';
  const valueCol = agg === 'count' ? undefined : source.numeric.find((c) => c.key === query.valueColumn);
  if (agg !== 'count' && !valueCol) return { headers: [], rows: [] };

  const cols = [groupCol.key, valueCol?.key].filter(Boolean).join(',');
  const { data, error } = await client.from(source.table).select(cols);
  if (error || !data) return { headers: [], rows: [] };

  // Tally in JS: sum/count per category (avg tracks a running count to divide).
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const row of data) {
    const raw = row[groupCol.key];
    const category = raw === null || raw === undefined || raw === '' ? 'Unspecified' : String(raw);
    const add = agg === 'count' ? 1 : Number(row[valueCol!.key] ?? 0) || 0;
    sums.set(category, (sums.get(category) ?? 0) + add);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  let entries = Array.from(sums.entries()).map(([category, sum]) => ({
    category,
    value: agg === 'avg' ? Math.round((sum / (counts.get(category) || 1)) * 100) / 100 : sum,
  }));
  entries.sort((a, b) => b.value - a.value);
  entries = entries.slice(0, MAX_CATEGORIES);

  const seriesName =
    agg === 'count' ? 'Count' : agg === 'sum' ? `Total ${valueCol!.label.toLowerCase()}` : `Avg ${valueCol!.label.toLowerCase()}`;

  return {
    headers: [groupCol.label, seriesName],
    rows: entries.map((e) => [e.category, e.value]),
  };
}
