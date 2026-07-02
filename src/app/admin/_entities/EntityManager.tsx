'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { createEntity, updateEntity, deleteEntity, setEntityActive } from '../actions/entities';
import { optionLabel, optionValue, type EntityConfig, type EntityTable, type Field } from './config';

export type RelOption = { id: string; label: string };
export type Relations = Record<string, { options: RelOption[]; labels: Record<string, string> }>;
type Row = Record<string, unknown>;

const inputBase = 'rounded-md border border-ink/20 px-3 py-2 w-full';

/** A single form control for `field`, pre-filled from `row` when editing. */
function FieldInput({ f, relOptions, row }: { f: Field; relOptions?: RelOption[]; row?: Row }) {
  const editing = row !== undefined;

  if (f.kind === 'localized') {
    const v = (row?.[f.key] ?? {}) as { en?: string; id?: string };
    return (
      <div className="grid grid-cols-2 gap-2">
        <input name={`${f.key}_en`} placeholder={`${f.label} (EN)`} className={inputBase} defaultValue={v.en ?? ''} />
        <input name={`${f.key}_id`} placeholder={`${f.label} (ID)`} className={inputBase} defaultValue={v.id ?? ''} />
      </div>
    );
  }
  if (f.kind === 'bool') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={f.key} defaultChecked={editing ? Boolean(row?.[f.key]) : true} /> {f.label}
      </label>
    );
  }
  if (f.kind === 'select') {
    return (
      <select name={f.key} className={inputBase} required={f.required} defaultValue={editing ? String(row?.[f.key] ?? '') : undefined}>
        {f.options?.map((o) => { const val = optionValue(o); return <option key={val} value={val}>{optionLabel(o)}</option>; })}
      </select>
    );
  }
  if (f.kind === 'relation') {
    return (
      <select name={f.key} className={inputBase} required={f.required} defaultValue={editing ? String(row?.[f.key] ?? '') : ''}>
        <option value="" disabled={f.required}>— {f.label} —</option>
        {(relOptions ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    );
  }
  const type = f.kind === 'email' ? 'email' : f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : f.kind === 'url' ? 'url' : 'text';
  let def: string | undefined;
  if (editing) {
    const raw = row?.[f.key];
    def = raw == null ? '' : f.kind === 'date' ? String(raw).slice(0, 10) : String(raw);
  }
  return (
    <input
      name={f.key}
      type={type}
      step={f.kind === 'number' ? 'any' : undefined}
      required={f.required}
      placeholder={f.label}
      className={inputBase}
      defaultValue={def}
    />
  );
}

/** Grid of field inputs shared by the create + edit forms. */
function FieldGrid({ cfg, relations, row }: { cfg: EntityConfig; relations: Relations; row?: Row }) {
  return (
    <>
      {cfg.fields.map((f) => (
        <div key={f.key} className={f.kind === 'localized' ? 'md:col-span-2' : ''}>
          <FieldInput f={f} relOptions={relations[f.key]?.options} row={row} />
        </div>
      ))}
    </>
  );
}

export function EntityManager({
  table,
  cfg,
  rows,
  relations,
  hasArchive,
}: {
  table: EntityTable;
  cfg: EntityConfig;
  rows: Row[];
  relations: Relations;
  hasArchive: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const createFormRef = useRef<HTMLFormElement>(null);

  const singular = cfg.title.replace(/s$/, '');

  const visibleRows = useMemo(() => {
    if (!hasArchive || showArchived) return rows;
    return rows.filter((r) => r.is_active !== false);
  }, [rows, hasArchive, showArchived]);

  const archivedCount = useMemo(
    () => (hasArchive ? rows.filter((r) => r.is_active === false).length : 0),
    [rows, hasArchive],
  );

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createEntity(table, formData);
      if (res?.error) setError(res.error);
      else createFormRef.current?.reset();
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateEntity(table, id, formData);
      if (res?.error) setError(res.error);
      else setEditingId(null);
    });
  }

  function handleArchive(id: string, active: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await setEntityActive(table, id, active);
      if (res?.error) setError(res.error);
    });
  }

  function handleDelete(id: string, label: string) {
    if (!window.confirm(`Delete this ${singular.toLowerCase()}${label ? ` (“${label}”)` : ''}? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteEntity(table, id);
      if (res?.error) setError(res.error);
    });
  }

  const cell = (row: Row, key: string) => {
    const v = row[key];
    if (relations[key] && v) return relations[key].labels[String(v)] ?? String(v);
    if (v != null) {
      const selField = cfg.fields.find((f) => f.key === key && f.kind === 'select');
      const opt = selField?.options?.find((o) => optionValue(o) === String(v));
      if (opt) return optionLabel(opt);
    }
    if (v && typeof v === 'object' && 'en' in (v as object)) return String((v as { en?: string }).en ?? '');
    if (typeof v === 'boolean') return v ? '✓' : '—';
    if (key === 'published_at' && v) return new Date(String(v)).toLocaleDateString();
    return v == null ? '—' : String(v);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-navy">{cfg.title}</h1>
          <p className="mt-1 text-ink/60">
            Per the brief, do not seed real content — add only genuine entries or clearly-labelled placeholders.
          </p>
        </div>
        {hasArchive && archivedCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-magenta/10 px-4 py-2 text-sm text-magenta">{error}</p>
      )}

      {/* Create */}
      <form ref={createFormRef} action={handleCreate} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/10 md:grid-cols-2">
        <FieldGrid cfg={cfg} relations={relations} />
        <div className="md:col-span-2">
          <button disabled={pending} className="rounded-md bg-magenta px-5 py-2 font-condensed uppercase tracking-wide text-white disabled:opacity-50">
            Add {singular}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              {cfg.list.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {visibleRows.length === 0 && (
              <tr><td colSpan={cfg.list.length + 1} className="px-4 py-8 text-center text-ink/40">Nothing here yet.</td></tr>
            )}
            {visibleRows.map((row) => {
              const id = String(row.id);
              const archived = hasArchive && row.is_active === false;
              if (editingId === id) {
                return (
                  <tr key={id} className="bg-paper/60">
                    <td colSpan={cfg.list.length + 1} className="p-5">
                      <form
                        action={(fd) => handleUpdate(id, fd)}
                        className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-ink/10 md:grid-cols-2"
                      >
                        <p className="md:col-span-2 font-condensed uppercase tracking-wide text-ink/60">Editing {singular}</p>
                        <FieldGrid cfg={cfg} relations={relations} row={row} />
                        <div className="md:col-span-2 flex gap-2">
                          <button disabled={pending} className="rounded-md bg-magenta px-5 py-2 font-condensed uppercase tracking-wide text-white disabled:opacity-50">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-ink/20 px-5 py-2 text-ink/70">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={id} className={archived ? 'opacity-50' : undefined}>
                  {cfg.list.map((c) => <td key={c} className="px-4 py-3">{cell(row, c)}</td>)}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingId(id); setError(null); }}
                        className="rounded-md border border-navy px-3 py-1.5 text-navy hover:bg-navy hover:text-white"
                      >
                        Edit
                      </button>
                      {hasArchive && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleArchive(id, archived)}
                          className="rounded-md border border-ink/30 px-3 py-1.5 text-ink/70 hover:bg-ink/5 disabled:opacity-50"
                        >
                          {archived ? 'Restore' : 'Archive'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDelete(id, cell(row, cfg.list[0]))}
                        className="rounded-md border border-magenta px-3 py-1.5 text-magenta hover:bg-magenta hover:text-white disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
