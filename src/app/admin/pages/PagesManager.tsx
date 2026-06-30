'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPage, updatePage, deletePage } from '@/app/admin/actions/cms';
import type { LocaleMap, NavSection, PageRecord, PageStatus } from '@/lib/types';

const SECTIONS: NavSection[] = ['none', 'about', 'mobility', 'partnership', 'life', 'news'];

type Draft = {
  title_en: string;
  title_id: string;
  slug: string;
  nav_section: NavSection;
  nav_order: number;
};

function toDraft(p: PageRecord): Draft {
  const title = (p.title ?? {}) as LocaleMap;
  return {
    title_en: title.en ?? '',
    title_id: title.id ?? '',
    slug: p.slug,
    nav_section: p.nav_section,
    nav_order: p.nav_order,
  };
}

const STATUS_STYLES: Record<PageStatus, string> = {
  published: 'text-green-600',
  draft: 'text-amber-600',
  archived: 'text-ink/40',
};

export function PagesManager({ initialPages }: { initialPages: PageRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Editable working copy, keyed by page id.
  const originals = useMemo(() => {
    const map: Record<string, Draft> = {};
    for (const p of initialPages) map[p.id] = toDraft(p);
    return map;
  }, [initialPages]);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(originals);

  // Re-sync working copy whenever the server data changes (after a refresh).
  const [snapshot, setSnapshot] = useState(originals);
  if (snapshot !== originals) {
    setSnapshot(originals);
    setDrafts(originals);
  }

  const setField = <K extends keyof Draft>(id: string, key: K, value: Draft[K]) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));

  const isDirty = (id: string) =>
    JSON.stringify(drafts[id]) !== JSON.stringify(originals[id]);

  const run = (id: string, fn: () => Promise<{ error?: string } | void>) => {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (res && 'error' in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const saveRow = (p: PageRecord) => {
    const d = drafts[p.id];
    run(p.id, () =>
      updatePage(p.id, p.slug, {
        slug: d.slug,
        title: { en: d.title_en, id: d.title_id },
        nav_section: d.nav_section,
        nav_order: Number(d.nav_order),
      }),
    );
  };

  const setStatus = (p: PageRecord, status: PageStatus) =>
    run(p.id, () => updatePage(p.id, p.slug, { status }));

  const remove = (p: PageRecord) => {
    if (!confirm(`Delete "${drafts[p.id]?.title_en || p.slug}"? This also deletes all its blocks.`)) return;
    run(p.id, async () => {
      await deletePage(p.id, p.slug);
    });
  };

  const create = (formData: FormData) => {
    formData.set('nav_order', String(initialPages.length));
    setError(null);
    setBusyId('__create__');
    startTransition(async () => {
      const res = await createPage(formData);
      setBusyId(null);
      if (res && 'error' in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const visible = initialPages.filter((p) => showArchived || p.status !== 'archived');
  const archivedCount = initialPages.filter((p) => p.status === 'archived').length;

  return (
    <div>
      {error && (
        <div className="mt-4 rounded-md bg-magenta/10 px-4 py-3 text-sm text-magenta ring-1 ring-magenta/30">
          {error}
        </div>
      )}

      {/* Create */}
      <form
        action={create}
        className="mt-6 grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/10 md:grid-cols-5"
      >
        <input name="slug" required placeholder="slug (e.g. semester-exchange)" className="rounded-md border border-ink/20 px-3 py-2" />
        <input name="title_en" required placeholder="Title (EN)" className="rounded-md border border-ink/20 px-3 py-2" />
        <input name="title_id" placeholder="Judul (ID)" className="rounded-md border border-ink/20 px-3 py-2" />
        <select name="nav_section" className="rounded-md border border-ink/20 px-3 py-2">
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          disabled={isPending && busyId === '__create__'}
          className="rounded-md bg-magenta px-4 py-2 font-condensed uppercase tracking-wide text-white disabled:opacity-50"
        >
          {isPending && busyId === '__create__' ? 'Creating…' : 'Create page'}
        </button>
      </form>

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-ink/50">
          {visible.length} page{visible.length === 1 ? '' : 's'} · edit any field then press Save
        </p>
        {archivedCount > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/60">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {/* List */}
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              <th className="px-3 py-3">Title (EN)</th>
              <th className="px-3 py-3">Title (ID)</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Section</th>
              <th className="px-3 py-3 w-20">Order</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink/40">
                  No pages yet. Create your first above.
                </td>
              </tr>
            )}
            {visible.map((p) => {
              const d = drafts[p.id] ?? toDraft(p);
              const dirty = isDirty(p.id);
              const rowBusy = isPending && busyId === p.id;
              const archived = p.status === 'archived';
              const cell = 'rounded-md border border-ink/20 px-2 py-1.5 w-full';
              return (
                <tr key={p.id} className={archived ? 'opacity-60' : undefined}>
                  <td className="px-3 py-2">
                    <input className={cell} value={d.title_en} onChange={(e) => setField(p.id, 'title_en', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={cell} value={d.title_id} onChange={(e) => setField(p.id, 'title_id', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={cell} value={d.slug} onChange={(e) => setField(p.id, 'slug', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={cell}
                      value={d.nav_section}
                      onChange={(e) => setField(p.id, 'nav_section', e.target.value as NavSection)}
                    >
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className={cell}
                      value={d.nav_order}
                      onChange={(e) => setField(p.id, 'nav_order', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className={STATUS_STYLES[p.status]}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        onClick={() => saveRow(p)}
                        disabled={!dirty || rowBusy}
                        className="rounded-md bg-navy px-3 py-1.5 text-white disabled:opacity-30"
                      >
                        {rowBusy ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                      </button>
                      <Link href={`/admin/edit/${p.slug}`} className="rounded-md border border-ink/20 px-3 py-1.5">
                        Blocks
                      </Link>
                      {!archived && (
                        <button
                          onClick={() => setStatus(p, p.status === 'published' ? 'draft' : 'published')}
                          disabled={rowBusy}
                          className="rounded-md border border-ink/20 px-3 py-1.5 disabled:opacity-40"
                        >
                          {p.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                      {archived ? (
                        <button
                          onClick={() => setStatus(p, 'draft')}
                          disabled={rowBusy}
                          className="rounded-md border border-ink/20 px-3 py-1.5 disabled:opacity-40"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(p, 'archived')}
                          disabled={rowBusy}
                          className="rounded-md border border-amber-500 px-3 py-1.5 text-amber-600 disabled:opacity-40"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => remove(p)}
                        disabled={rowBusy}
                        className="rounded-md border border-magenta px-3 py-1.5 text-magenta disabled:opacity-40"
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
