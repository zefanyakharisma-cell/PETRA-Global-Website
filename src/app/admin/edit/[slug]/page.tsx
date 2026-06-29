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

  const p = page as PageRecord;

  return (
    <div className="-m-8">
      <div className="flex items-center gap-3 border-b border-ink/10 bg-paper px-4 py-2 text-sm">
        <Link href="/admin/pages" className="text-ink/60 hover:text-navy">← Pages</Link>
        <span className="font-medium">{t(p.title as LocaleMap, 'en')}</span>
      </div>
      <Editor pageId={p.id} slug={p.slug} initialBlocks={(blocks ?? []) as Block[]} initialStatus={p.status} />
    </div>
  );
}
