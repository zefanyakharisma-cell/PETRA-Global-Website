import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createPage, setPageStatus, deletePage } from '../actions/cms';
import { t, type LocaleMap, type PageRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SECTIONS = ['none', 'about', 'mobility', 'partnership', 'life', 'news'] as const;

export default async function PagesAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from('pages').select('*').order('nav_section').order('nav_order');
  const pages = (data ?? []) as PageRecord[];

  // Inline server actions (bound per row in the markup below).
  async function publishAction(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const slug = String(formData.get('slug'));
    const status = String(formData.get('status')) as 'draft' | 'published';
    await setPageStatus(id, status, slug);
    revalidatePath('/admin/pages');
  }
  async function deleteAction(formData: FormData) {
    'use server';
    await deletePage(String(formData.get('id')), String(formData.get('slug')));
    revalidatePath('/admin/pages');
  }
  async function createAction(formData: FormData) {
    'use server';
    await createPage(formData);
    revalidatePath('/admin/pages');
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Pages</h1>
      <p className="mt-1 text-ink/60">
        Navigation builds automatically from published pages, grouped by section. Add pages into existing
        sections — top-level nav items are fixed.
      </p>

      {/* Create */}
      <form action={createAction} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/10 md:grid-cols-5">
        <input name="slug" required placeholder="slug (e.g. semester-exchange)" className="rounded-md border border-ink/20 px-3 py-2" />
        <input name="title_en" required placeholder="Title (EN)" className="rounded-md border border-ink/20 px-3 py-2" />
        <input name="title_id" placeholder="Judul (ID)" className="rounded-md border border-ink/20 px-3 py-2" />
        <select name="nav_section" className="rounded-md border border-ink/20 px-3 py-2">
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="rounded-md bg-magenta px-4 py-2 font-condensed uppercase tracking-wide text-white">Create page</button>
        <input type="hidden" name="nav_order" value={pages.length} />
      </form>

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              <th className="px-4 py-3">Title</th><th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Section</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {pages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No pages yet. Create your first above.</td></tr>
            )}
            {pages.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{t(p.title as LocaleMap, 'en')}</td>
                <td className="px-4 py-3 text-ink/60">/{p.slug}</td>
                <td className="px-4 py-3">{p.nav_section}</td>
                <td className="px-4 py-3">
                  <span className={p.status === 'published' ? 'text-green-600' : 'text-amber-600'}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/edit/${p.slug}`} className="rounded-md bg-navy px-3 py-1.5 text-white">Edit</Link>
                    <form action={publishAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="slug" value={p.slug} />
                      <input type="hidden" name="status" value={p.status === 'published' ? 'draft' : 'published'} />
                      <button className="rounded-md border border-ink/20 px-3 py-1.5">
                        {p.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </form>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="slug" value={p.slug} />
                      <button className="rounded-md border border-magenta px-3 py-1.5 text-magenta">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
