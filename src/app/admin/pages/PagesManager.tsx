'use client';

import { Fragment, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { createPage, createHomePage, updatePage, deletePage, reorderPages } from '@/app/admin/actions/cms';
import type { LocaleMap, NavSection, PageRecord, PageStatus } from '@/lib/types';

const SECTIONS: NavSection[] = ['none', 'about', 'mobility', 'partnership', 'life', 'news'];

// Human-friendly labels for the section separators in the list below. Rows arrive
// sorted by nav_section, so grouping is just a header before each new section.
const SECTION_LABELS: Record<NavSection, string> = {
  none: 'No section — standalone pages',
  about: 'About',
  mobility: 'Mobility',
  partnership: 'Partnership',
  life: 'Life',
  news: 'News',
};

type Draft = {
  title_en: string;
  title_id: string;
  slug: string;
  nav_section: NavSection;
  nav_order: number;
  parent_id: string;
};

function toDraft(p: PageRecord): Draft {
  const title = (p.title ?? {}) as LocaleMap;
  return {
    title_en: title.en ?? '',
    title_id: title.id ?? '',
    slug: p.slug,
    nav_section: p.nav_section,
    nav_order: p.nav_order,
    parent_id: p.parent_id ?? '',
  };
}

const STATUS_STYLES: Record<PageStatus, string> = {
  published: 'text-green-600',
  draft: 'text-amber-600',
  archived: 'text-ink/40',
};

const CELL = 'rounded-md border border-ink/20 px-2 py-1.5 w-full';

export function PagesManager({ initialPages }: { initialPages: PageRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // The home page renders at the site root and is managed via its own card, so
  // keep it out of the sortable/editable table below.
  const homePage = useMemo(() => initialPages.find((p) => p.slug === 'home') ?? null, [initialPages]);
  const otherPages = useMemo(() => initialPages.filter((p) => p.slug !== 'home'), [initialPages]);

  // Parent options for nesting a page under another (builds the layered nav).
  const parentOptions = useMemo(
    () =>
      otherPages.map((p) => ({
        id: p.id,
        label: (p.title as LocaleMap)?.en?.trim() || p.slug,
      })),
    [otherPages],
  );

  const originals = useMemo(() => {
    const map: Record<string, Draft> = {};
    for (const p of otherPages) map[p.id] = toDraft(p);
    return map;
  }, [otherPages]);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(originals);
  const [rows, setRows] = useState<PageRecord[]>(otherPages);

  // Re-sync working copies whenever the server data changes (after a refresh).
  const [snapshot, setSnapshot] = useState(initialPages);
  if (snapshot !== initialPages) {
    setSnapshot(initialPages);
    setDrafts(originals);
    setRows(otherPages);
  }

  const createHome = () => {
    setError(null);
    setBusyId('__home__');
    startTransition(async () => {
      const res = await createHomePage();
      setBusyId(null);
      if (res && 'error' in res && res.error) {
        setError(res.error);
        return;
      }
      router.push('/admin/edit/home');
    });
  };

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

  const saveRow = (p: PageRecord) => {
    const d = drafts[p.id];
    run(p.id, () =>
      updatePage(p.id, p.slug, {
        slug: d.slug,
        title: { en: d.title_en, id: d.title_id },
        nav_section: d.nav_section,
        nav_order: Number(d.nav_order),
        parent_id: d.parent_id || null,
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
    formData.set('nav_order', String(otherPages.length));
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

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activePage = rows.find((p) => p.id === active.id);
    const overPage = rows.find((p) => p.id === over.id);
    if (!activePage || !overPage) return;

    // Reordering is per-section (nav builds order within each section). Drop a row
    // onto another section's row? Use the Section dropdown + Save to move it instead.
    if (activePage.nav_section !== overPage.nav_section) {
      setError('Drag reorders within a section. To change section, use the Section dropdown then Save.');
      return;
    }

    const next = arrayMove(rows, rows.indexOf(activePage), rows.indexOf(overPage));
    setRows(next);

    // Resequence nav_order for the affected section from its new visual order.
    const section = activePage.nav_section;
    const updates = next
      .filter((p) => p.nav_section === section)
      .map((p, index) => ({ id: p.id, nav_order: index }));

    setError(null);
    startTransition(async () => {
      await reorderPages(updates);
      router.refresh();
    });
  };

  const visible = rows.filter((p) => showArchived || p.status !== 'archived');
  const archivedCount = rows.filter((p) => p.status === 'archived').length;

  return (
    <div>
      {error && (
        <div className="mt-4 rounded-md bg-magenta/10 px-4 py-3 text-sm text-magenta ring-1 ring-magenta/30">
          {error}
        </div>
      )}

      {/* Home page — special: renders at the site root, edited via its own blocks. */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-navy/5 p-5 ring-1 ring-navy/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-condensed text-lg uppercase tracking-wide text-navy">Home page</h2>
          {homePage ? (
            <p className="mt-0.5 text-sm text-ink/60">
              Shown at the site root when published. Status:{' '}
              <span className={STATUS_STYLES[homePage.status]}>{homePage.status}</span>
              {homePage.status !== 'published' && ' — the built-in default is live until you publish.'}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-ink/60">
              The homepage currently uses the built-in default design. Create a CMS copy to edit it
              block by block — you start from the exact current design, nothing is lost.
            </p>
          )}
        </div>
        {homePage ? (
          <Link
            href="/admin/edit/home"
            className="shrink-0 rounded-md bg-navy px-4 py-2 text-center font-condensed uppercase tracking-wide text-white"
          >
            Edit home blocks
          </Link>
        ) : (
          <button
            onClick={createHome}
            disabled={isPending && busyId === '__home__'}
            className="shrink-0 rounded-md bg-navy px-4 py-2 font-condensed uppercase tracking-wide text-white disabled:opacity-50"
          >
            {isPending && busyId === '__home__' ? 'Creating…' : 'Create home page'}
          </button>
        )}
      </div>

      {/* Create */}
      <form action={create} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/10 md:grid-cols-6">
        <input name="slug" required placeholder="slug (e.g. mobility/inbound/semester-exchange)" className="rounded-md border border-ink/20 px-3 py-2 md:col-span-2" />
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
        <select name="parent_id" defaultValue="" className="rounded-md border border-ink/20 px-3 py-2 md:col-span-6">
          <option value="">No parent (top level of its section)</option>
          {parentOptions.map((o) => (
            <option key={o.id} value={o.id}>Parent: {o.label}</option>
          ))}
        </select>
      </form>
      <p className="mt-2 text-xs text-ink/50">
        Nesting: set a <strong>Parent</strong> to place a page inside another (e.g. <em>Semester Exchange</em> under <em>Inbound Programs</em>).
        Use the full path as the slug so the URL mirrors the hierarchy — e.g. <code>mobility/inbound/semester-exchange</code>.
      </p>

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-ink/50">
          {visible.length} page{visible.length === 1 ? '' : 's'} · drag <GripVertical className="inline h-4 w-4 align-text-bottom" /> to reorder within a section · edit a field then Save
        </p>
        {archivedCount > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/60">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {/* List */}
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              <th className="px-3 py-3">Title (EN)</th>
              <th className="px-3 py-3">Title (ID)</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Section</th>
              <th className="px-3 py-3">Parent</th>
              <th className="w-20 px-3 py-3">Order</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink/40">
                  No pages yet. Create your first above.
                </td>
              </tr>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {visible.map((p, i) => {
                  const showHeader = i === 0 || visible[i - 1].nav_section !== p.nav_section;
                  return (
                    <Fragment key={p.id}>
                      {showHeader && (
                        <tr className="bg-navy/5">
                          <td colSpan={9} className="px-3 py-2 font-condensed text-xs uppercase tracking-wider text-navy">
                            {SECTION_LABELS[p.nav_section] ?? p.nav_section}
                          </td>
                        </tr>
                      )}
                      <SortableRow
                        page={p}
                        draft={drafts[p.id] ?? toDraft(p)}
                        dirty={isDirty(p.id)}
                        busy={isPending && busyId === p.id}
                        parentOptions={parentOptions}
                        onField={setField}
                        onSave={saveRow}
                        onStatus={setStatus}
                        onRemove={remove}
                      />
                    </Fragment>
                  );
                })}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableRow({
  page,
  draft,
  dirty,
  busy,
  parentOptions,
  onField,
  onSave,
  onStatus,
  onRemove,
}: {
  page: PageRecord;
  draft: Draft;
  dirty: boolean;
  busy: boolean;
  parentOptions: { id: string; label: string }[];
  onField: <K extends keyof Draft>(id: string, key: K, value: Draft[K]) => void;
  onSave: (p: PageRecord) => void;
  onStatus: (p: PageRecord, status: PageStatus) => void;
  onRemove: (p: PageRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const archived = page.status === 'archived';
  const id = page.id;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={[archived ? 'opacity-60' : '', isDragging ? 'relative z-10 bg-paper shadow-lg' : ''].join(' ')}
    >
      <td className="px-2 py-2 align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab text-ink/30 hover:text-ink/60 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-3 py-2">
        <input className={CELL} value={draft.title_en} onChange={(e) => onField(id, 'title_en', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input className={CELL} value={draft.title_id} onChange={(e) => onField(id, 'title_id', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input className={CELL} value={draft.slug} onChange={(e) => onField(id, 'slug', e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <select className={CELL} value={draft.nav_section} onChange={(e) => onField(id, 'nav_section', e.target.value as NavSection)}>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          className={CELL}
          value={draft.parent_id}
          onChange={(e) => onField(id, 'parent_id', e.target.value)}
        >
          <option value="">— none —</option>
          {parentOptions
            .filter((o) => o.id !== id)
            .map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className={CELL}
          value={draft.nav_order}
          onChange={(e) => onField(id, 'nav_order', Number(e.target.value))}
        />
      </td>
      <td className="px-3 py-2">
        <span className={STATUS_STYLES[page.status]}>{page.status}</span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button onClick={() => onSave(page)} disabled={!dirty || busy} className="rounded-md bg-navy px-3 py-1.5 text-white disabled:opacity-30">
            {busy ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
          <Link href={`/admin/edit/${page.slug}`} className="rounded-md border border-ink/20 px-3 py-1.5">
            Blocks
          </Link>
          {!archived && (
            <button
              onClick={() => onStatus(page, page.status === 'published' ? 'draft' : 'published')}
              disabled={busy}
              className="rounded-md border border-ink/20 px-3 py-1.5 disabled:opacity-40"
            >
              {page.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          )}
          {archived ? (
            <button onClick={() => onStatus(page, 'draft')} disabled={busy} className="rounded-md border border-ink/20 px-3 py-1.5 disabled:opacity-40">
              Restore
            </button>
          ) : (
            <button onClick={() => onStatus(page, 'archived')} disabled={busy} className="rounded-md border border-amber-500 px-3 py-1.5 text-amber-600 disabled:opacity-40">
              Archive
            </button>
          )}
          <button onClick={() => onRemove(page)} disabled={busy} className="rounded-md border border-magenta px-3 py-1.5 text-magenta disabled:opacity-40">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
