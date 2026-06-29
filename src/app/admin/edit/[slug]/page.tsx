import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Editor } from '@/components/admin/Editor';
import { t, type Block, type LocaleMap, type PageRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase.from('pages').select('*').eq('slug', slug).maybeSingle();
  if (!page) notFound();

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('position');

  // Entity options powering the editor's dropdowns (staff / program pickers).
  const [{ data: staffRows }, { data: programRows }] = await Promise.all([
    supabase.from('staff').select('id, name').order('name'),
    supabase.from('programs').select('id, slug, title'),
  ]);
  const entities = {
    staff: (staffRows ?? []).map((s) => ({ id: s.id as string, label: (s.name as string) ?? s.id })),
    programs: (programRows ?? []).map((pr) => ({
      id: pr.id as string,
      label: t(pr.title as LocaleMap, 'en') || (pr.slug as string) || (pr.id as string),
    })),
  };

  const p = page as PageRecord;

  return (
    <div className="-m-8">
      <div className="flex items-center gap-3 border-b border-ink/10 bg-paper px-4 py-2 text-sm">
        <Link href="/admin/pages" className="text-ink/60 hover:text-navy">← Pages</Link>
        <span className="font-medium">{t(p.title as LocaleMap, 'en')}</span>
      </div>
      <Editor pageId={p.id} slug={p.slug} initialBlocks={(blocks ?? []) as Block[]} initialStatus={p.status} entities={entities} />
    </div>
  );
}
