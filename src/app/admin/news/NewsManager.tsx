'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createNews, updateNews, deleteNews } from '@/app/admin/actions/cms';
import type { LocaleMap, NewsRecord } from '@/lib/types';

type Draft = {
  title_en: string;
  title_id: string;
  slug: string;
  tags: string; // comma-separated
  cover_url: string;
  published_at: string; // yyyy-MM-dd or ''
};

/** timestamptz ISO → the yyyy-MM-dd a <input type="date"> expects. */
function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toDraft(n: NewsRecord): Draft {
  const title = (n.title ?? {}) as LocaleMap;
  return {
    title_en: title.en ?? '',
    title_id: title.id ?? '',
    slug: n.slug,
    tags: (n.tags ?? []).join(', '),
    cover_url: n.cover_url ?? '',
    published_at: toDateInput(n.published_at),
  };
}

function statusOf(n: NewsRecord): { label: string; className: string } {
  if (!n.published_at) return { label: 'draft', className: 'text-amber-600' };
  if (new Date(n.published_at).getTime() > Date.now()) return { label: 'scheduled', className: 'text-cyan-600' };
  return { label: 'published', className: 'text-green-600' };
}

const CELL = 'rounded-md border border-ink/20 px-2 py-1.5 w-full';

export function NewsManager({ initialNews }: { initialNews: NewsRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const originals = useMemo(() => {
    const map: Record<string, Draft> = {};
    for (const n of initialNews) map[n.id] = toDraft(n);
    return map;
  }, [initialNews]);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(originals);

  // Re-sync working copies whenever the server data changes (after a refresh).
  const [snapshot, setSnapshot] = useState(initialNews);
  if (snapshot !== initialNews) {
    setSnapshot(initialNews);
    setDrafts(originals);
  }

  const setField = <K extends keyof Draft>(id: string, key: K, value: Draft[K]) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));

  const isDirty = (id: string) => JSON.stringify(drafts[id]) !== JSON.stringify(originals[id]);

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

  const draftToPatch = (d: Draft) => ({
    slug: d.slug,
    title: { en: d.title_en, id: d.title_id },
    tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean),
    cover_url: d.cover_url,
    published_at: d.published_at ? new Date(d.published_at).toISOString() : null,
  });

  const saveRow = (n: NewsRecord) => {
    const d = drafts[n.id];
    run(n.id, () => updateNews(n.id, n.slug, draftToPatch(d)));
  };

  const togglePublish = (n: NewsRecord) => {
    const publishing = !n.published_at;
    run(n.id, () =>
      updateNews(n.id, n.slug, { published_at: publishing ? new Date().toISOString() : null }),
    );
  };

  const remove = (n: NewsRecord) => {
    if (!confirm(`Delete "${drafts[n.id]?.title_en || n.slug}"? This also deletes all its blocks.`)) return;
    run(n.id, async () => {
      await deleteNews(n.id, n.slug);
    });
  };

  const create = (formData: FormData) => {
    setError(null);
    setBusyId('__create__');
    startTransition(async () => {
      const res = await createNews(formData);
      setBusyId(null);
      if (res && 'error' in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      {error && (
        <div className="mt-4 rounded-md bg-magenta/10 px-4 py-3 text-sm text-magenta ring-1 ring-magenta/30">
          {error}
        </div>
      )}

      {/* Create */}
      <form action={create} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/10 md:grid-cols-4">
        <input name="slug" required placeholder="slug (e.g. exchange-fair-2026)" className="rounded-md border border-ink/20 px-3 py-2" />
        <input name="title_en" required placeholder="Title (EN)" className="rounded-md border border-ink/20 px-3 py-2" />
        <input name="title_id" placeholder="Judul (ID)" className="rounded-md border border-ink/20 px-3 py-2" />
        <button
          disabled={isPending && busyId === '__create__'}
          className="rounded-md bg-magenta px-4 py-2 font-condensed uppercase tracking-wide text-white disabled:opacity-50"
        >
          {isPending && busyId === '__create__' ? 'Creating…' : 'Add article'}
        </button>
      </form>

      {/* List */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              <th className="px-3 py-3">Title (EN)</th>
              <th className="px-3 py-3">Title (ID)</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Tags</th>
              <th className="px-3 py-3">Publish date</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {initialNews.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink/40">
                  No articles yet. Create your first above.
                </td>
              </tr>
            )}
            {initialNews.map((n) => {
              const d = drafts[n.id] ?? toDraft(n);
              const dirty = isDirty(n.id);
              const busy = isPending && busyId === n.id;
              const status = statusOf(n);
              const id = n.id;
              return (
                <tr key={id}>
                  <td className="px-3 py-2">
                    <input className={CELL} value={d.title_en} onChange={(e) => setField(id, 'title_en', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={CELL} value={d.title_id} onChange={(e) => setField(id, 'title_id', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={CELL} value={d.slug} onChange={(e) => setField(id, 'slug', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={CELL} placeholder="inbound, outbound" value={d.tags} onChange={(e) => setField(id, 'tags', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="date" className={CELL} value={d.published_at} onChange={(e) => setField(id, 'published_at', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <span className={status.className}>{status.label}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button onClick={() => saveRow(n)} disabled={!dirty || busy} className="rounded-md bg-navy px-3 py-1.5 text-white disabled:opacity-30">
                        {busy ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                      </button>
                      <Link href={`/admin/news/edit/${n.slug}`} className="rounded-md border border-ink/20 px-3 py-1.5">
                        Blocks
                      </Link>
                      <button
                        onClick={() => togglePublish(n)}
                        disabled={busy}
                        className="rounded-md border border-ink/20 px-3 py-1.5 disabled:opacity-40"
                      >
                        {n.published_at ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => remove(n)} disabled={busy} className="rounded-md border border-magenta px-3 py-1.5 text-magenta disabled:opacity-40">
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
