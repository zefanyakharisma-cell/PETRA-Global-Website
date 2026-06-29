import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import type { Block, Locale, PageRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Draft-aware live preview rendered inside the editor's iframe. Renders the
 * REAL server block components from current (possibly draft) state. Guarded by
 * middleware (treated like /admin) so only authed admins can view drafts.
 */
export default async function EditorPreview({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale = 'en' } = await searchParams;

  const supabase = await createClient();
  const { data: page } = await supabase.from('pages').select('*').eq('slug', slug).maybeSingle();
  if (!page) notFound();

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('position');

  return (
    <BlockRenderer
      blocks={(blocks ?? []) as Block[]}
      locale={locale as Locale}
      mode="public"
      pageOwnerStaffId={(page as PageRecord).owner_staff_id}
    />
  );
}
