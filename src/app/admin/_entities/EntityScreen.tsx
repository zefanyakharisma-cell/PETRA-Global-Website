import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createEntity, deleteEntity } from '../actions/entities';
import { ENTITY_CONFIG, type EntityTable, type Field } from './config';

function FieldInput({ f }: { f: Field }) {
  const base = 'rounded-md border border-ink/20 px-3 py-2 w-full';
  if (f.kind === 'localized') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <input name={`${f.key}_en`} placeholder={`${f.label} (EN)`} className={base} />
        <input name={`${f.key}_id`} placeholder={`${f.label} (ID)`} className={base} />
      </div>
    );
  }
  if (f.kind === 'bool') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={f.key} defaultChecked /> {f.label}
      </label>
    );
  }
  if (f.kind === 'select') {
    return (
      <select name={f.key} className={base} required={f.required}>
        {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  const type = f.kind === 'email' ? 'email' : f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : f.kind === 'url' ? 'url' : 'text';
  return <input name={f.key} type={type} step={f.kind === 'number' ? 'any' : undefined} required={f.required} placeholder={f.label} className={base} />;
}

/** Generic list + create form for an entity, driven by ENTITY_CONFIG. */
export async function EntityScreen({ table }: { table: EntityTable }) {
  const cfg = ENTITY_CONFIG[table];
  const supabase = await createClient();
  const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
  const rows = (data ?? []) as Record<string, unknown>[];

  async function create(formData: FormData) {
    'use server';
    await createEntity(table, formData);
    revalidatePath(`/admin/${table}`);
  }
  async function remove(formData: FormData) {
    'use server';
    await deleteEntity(table, String(formData.get('id')));
    revalidatePath(`/admin/${table}`);
  }

  const cell = (row: Record<string, unknown>, key: string) => {
    const v = row[key];
    if (v && typeof v === 'object' && 'en' in (v as object)) return String((v as { en?: string }).en ?? '');
    if (typeof v === 'boolean') return v ? '✓' : '—';
    if (key === 'published_at' && v) return new Date(String(v)).toLocaleDateString();
    return v == null ? '—' : String(v);
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-navy">{cfg.title}</h1>
      <p className="mt-1 text-ink/60">
        Per the brief, do not seed real content — add only genuine entries or clearly-labelled placeholders.
      </p>

      <form action={create} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/10 md:grid-cols-2">
        {cfg.fields.map((f) => (
          <div key={f.key} className={f.kind === 'localized' ? 'md:col-span-2' : ''}>
            <FieldInput f={f} />
          </div>
        ))}
        <div className="md:col-span-2">
          <button className="rounded-md bg-magenta px-5 py-2 font-condensed uppercase tracking-wide text-white">
            Add {cfg.title.replace(/s$/, '')}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              {cfg.list.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr><td colSpan={cfg.list.length + 1} className="px-4 py-8 text-center text-ink/40">Nothing here yet.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={String(row.id)}>
                {cfg.list.map((c) => <td key={c} className="px-4 py-3">{cell(row, c)}</td>)}
                <td className="px-4 py-3 text-right">
                  <form action={remove}>
                    <input type="hidden" name="id" value={String(row.id)} />
                    <button className="rounded-md border border-magenta px-3 py-1.5 text-magenta">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
