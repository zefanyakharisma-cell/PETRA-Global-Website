import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Editor } from '@/components/admin/Editor';
import { loadEditorEntities } from '@/lib/supabase/editorEntities';
import { t, type Block, type LocaleMap, type NewsRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditNewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase.from('news').select('*').eq('slug', slug).maybeSingle();
  if (!article) notFound();

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('news_id', article.id)
    .order('position');

  // Entity options powering the editor's dropdowns + checkbox pickers.
  const entities = await loadEditorEntities(supabase);

  const n = article as NewsRecord;

  return (
    <div className="-m-8">
      <div className="flex items-center gap-3 border-b border-ink/10 bg-paper px-4 py-2 text-sm">
        <Link href="/admin/news" className="text-ink/60 hover:text-navy">← News</Link>
        <span className="font-medium">{t(n.title as LocaleMap, 'en')}</span>
      </div>
      <Editor
        owner={{ kind: 'news', id: n.id }}
        slug={n.slug}
        initialBlocks={(blocks ?? []) as Block[]}
        initialPublished={n.published_at != null}
        entities={entities}
      />
    </div>
  );
}
