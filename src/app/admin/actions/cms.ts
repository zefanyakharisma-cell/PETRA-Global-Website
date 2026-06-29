'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { BLOCK_META } from '@/components/blocks/registry.meta';
import type { BlockType, NavSection, PageStatus } from '@/lib/types';

/** Refresh public ISR for a page (both locales) plus the home. */
function revalidatePublic(slug?: string) {
  revalidatePath('/', 'layout');
  if (slug) {
    revalidatePath(`/en/${slug}`);
    revalidatePath(`/id/${slug}`);
  }
}

// ---- Pages -----------------------------------------------------------------
export async function createPage(formData: FormData) {
  const supabase = await createClient();
  const slug = String(formData.get('slug') ?? '').trim();
  const titleEn = String(formData.get('title_en') ?? '');
  const titleId = String(formData.get('title_id') ?? '');
  const nav_section = (String(formData.get('nav_section') ?? 'none') as NavSection);
  const nav_order = Number(formData.get('nav_order') ?? 0);

  const { error } = await supabase.from('pages').insert({
    slug,
    title: { en: titleEn, id: titleId },
    nav_section,
    nav_order,
    status: 'draft',
  });
  if (error) return { error: error.message };
  revalidatePublic(slug);
  return { ok: true };
}

export async function setPageStatus(id: string, status: PageStatus, slug: string) {
  const supabase = await createClient();
  await supabase.from('pages').update({ status }).eq('id', id);
  revalidatePublic(slug);
}

export async function updatePageMeta(id: string, slug: string, patch: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from('pages').update(patch as never).eq('id', id);
  revalidatePublic(slug);
}

export async function deletePage(id: string, slug: string) {
  const supabase = await createClient();
  await supabase.from('pages').delete().eq('id', id); // blocks cascade
  revalidatePublic(slug);
}

// ---- Blocks (live editor) --------------------------------------------------
export async function addBlock(pageId: string, type: BlockType, slug: string) {
  const supabase = await createClient();
  const def = BLOCK_META[type];

  const { data: last } = await supabase
    .from('blocks')
    .select('position')
    .eq('page_id', pageId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('blocks')
    .insert({ page_id: pageId, type, position, config: def.defaultConfig, content: def.defaultContent } as never)
    .select('id')
    .single();
  if (error) return { error: error.message };
  revalidatePublic(slug);
  return { ok: true, id: data?.id };
}

export async function updateBlock(
  id: string,
  slug: string,
  patch: { config?: Record<string, unknown>; content?: Record<string, unknown> },
) {
  const supabase = await createClient();
  await supabase.from('blocks').update(patch as never).eq('id', id);
  revalidatePublic(slug);
}

export async function deleteBlock(id: string, slug: string) {
  const supabase = await createClient();
  await supabase.from('blocks').delete().eq('id', id);
  revalidatePublic(slug);
}

export async function duplicateBlock(id: string, slug: string) {
  const supabase = await createClient();
  const { data: src } = await supabase.from('blocks').select('*').eq('id', id).single();
  if (!src) return;
  await supabase.from('blocks').insert({
    page_id: src.page_id,
    type: src.type as BlockType,
    position: src.position + 1,
    config: src.config,
    content: src.content,
  } as never);
  revalidatePublic(slug);
}

/** Persist a new ordering (array of block ids in display order). */
export async function reorderBlocks(ids: string[], slug: string) {
  const supabase = await createClient();
  await Promise.all(
    ids.map((id, index) => supabase.from('blocks').update({ position: index }).eq('id', id)),
  );
  revalidatePublic(slug);
}
