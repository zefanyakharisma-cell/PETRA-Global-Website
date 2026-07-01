import { createClient } from '@/lib/supabase/server';
import { ENTITY_CONFIG, type EntityTable } from './config';
import { EntityManager, type Relations, type RelOption } from './EntityManager';

/** Pull a localized name (or slug) off a parent row for use as a dropdown label. */
function rowLabel(row: Record<string, unknown>): string {
  const name = row.name;
  if (name && typeof name === 'object' && 'en' in (name as object)) {
    const en = (name as { en?: string }).en;
    if (en) return en;
  }
  return String(row.slug ?? row.code ?? row.id ?? '');
}

/** Data-fetching wrapper: loads rows + relation options, then renders the interactive manager. */
export async function EntityScreen({ table }: { table: EntityTable }) {
  const cfg = ENTITY_CONFIG[table];
  const supabase = await createClient();
  const hasArchive = cfg.fields.some((f) => f.key === 'is_active');
  const orderByPosition = cfg.fields.some((f) => f.key === 'position');

  // Load every row (archived included) so the admin can review + restore them.
  const { data } = orderByPosition
    ? await supabase.from(table).select('*').order('position', { ascending: true })
    : await supabase.from(table).select('*').order('created_at', { ascending: false });
  const rows = (data ?? []) as Record<string, unknown>[];

  // Load dropdown options + an id→label lookup for every relation field.
  const relations: Relations = {};
  for (const f of cfg.fields) {
    if (f.kind === 'relation' && f.relTable) {
      const { data: relData } = await supabase.from(f.relTable).select('*');
      const options: RelOption[] = (relData ?? []).map((r) => ({ id: String(r.id), label: rowLabel(r as Record<string, unknown>) }));
      relations[f.key] = {
        options,
        labels: Object.fromEntries(options.map((o) => [o.id, o.label])),
      };
    }
  }

  return <EntityManager table={table} cfg={cfg} rows={rows} relations={relations} hasArchive={hasArchive} />;
}
