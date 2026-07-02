'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { BLOCK_META } from '@/components/blocks/registry.meta';
import { defaultHomeBlocks } from '@/lib/defaultHome';
import type { BlockType, LocaleMap, NavSection, PageStatus } from '@/lib/types';

/** Refresh public ISR for a page (both locales) plus the home. */
function revalidatePublic(slug?: string) {
  revalidatePath('/', 'layout');
  if (slug) {
    revalidatePath(`/en/${slug}`);
    revalidatePath(`/id/${slug}`);
  }
}

/** Refresh public ISR for a news article (both locales) plus the home/feeds. */
function revalidateNews(slug?: string) {
  revalidatePath('/', 'layout');
  if (slug) {
    revalidatePath(`/en/news/${slug}`);
    revalidatePath(`/id/news/${slug}`);
  }
}

/** A block belongs to exactly one owner — a page or a news article. */
export type BlockOwner = { kind: 'page' | 'news'; id: string };

function ownerColumn(owner: BlockOwner) {
  return owner.kind === 'news' ? 'news_id' : 'page_id';
}

function revalidateOwner(owner: BlockOwner, slug: string) {
  if (owner.kind === 'news') revalidateNews(slug);
  else revalidatePublic(slug);
}

// ---- Pages -----------------------------------------------------------------
export async function createPage(formData: FormData) {
  const supabase = await createClient();
  const slug = String(formData.get('slug') ?? '').trim();
  const titleEn = String(formData.get('title_en') ?? '');
  const titleId = String(formData.get('title_id') ?? '');
  const nav_section = (String(formData.get('nav_section') ?? 'none') as NavSection);
  const nav_order = Number(formData.get('nav_order') ?? 0);
  const parentRaw = String(formData.get('parent_id') ?? '').trim();
  const parent_id = parentRaw || null;

  const { error } = await supabase.from('pages').insert({
    slug,
    title: { en: titleEn, id: titleId },
    nav_section,
    nav_order,
    parent_id,
    status: 'draft',
  });
  if (error) {
    if (error.code === '23505') return { error: 'That slug is already in use.' };
    return { error: error.message };
  }
  revalidatePath('/admin/pages');
  revalidatePublic(slug);
  return { ok: true };
}

/**
 * The home page lives in the CMS under the reserved slug `home`, but unlike
 * other pages it renders at the site root (`/`). Until it exists, the root
 * falls back to the built-in `defaultHomeBlocks()` composition. This seeds a
 * `home` page pre-filled with that exact composition so an admin edits the real
 * design in the block editor instead of rebuilding it from scratch. It starts as
 * a draft — publishing it is what makes the CMS version take over the homepage.
 */
export async function createHomePage() {
  const supabase = await createClient();

  // Idempotent: never create a second `home` page.
  const { data: existing } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', 'home')
    .maybeSingle();
  if (existing) return { ok: true, id: existing.id as string, existed: true };

  const { data: page, error } = await supabase
    .from('pages')
    .insert({
      slug: 'home',
      title: { en: 'Home', id: 'Beranda' },
      nav_section: 'none', // the home page is not part of the auto-built nav
      nav_order: 0,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') return { error: 'A home page already exists.' };
    return { error: error.message };
  }

  const pageId = page.id as string;
  const seed = defaultHomeBlocks().map((b) => ({
    page_id: pageId,
    type: b.type,
    position: b.position,
    config: b.config,
    content: b.content,
  }));
  const { error: blockError } = await supabase.from('blocks').insert(seed as never);
  if (blockError) {
    // Roll back the page so the admin can retry cleanly.
    await supabase.from('pages').delete().eq('id', pageId);
    return { error: blockError.message };
  }

  revalidatePath('/admin/pages');
  revalidatePublic('home');
  return { ok: true, id: pageId };
}

export async function setPageStatus(id: string, status: PageStatus, slug: string) {
  const supabase = await createClient();
  await supabase.from('pages').update({ status }).eq('id', id);
  revalidatePath('/admin/pages');
  revalidatePublic(slug);
}

export async function updatePageMeta(id: string, slug: string, patch: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from('pages').update(patch as never).eq('id', id);
  revalidatePath('/admin/pages');
  revalidatePublic(slug);
}

/**
 * Flexible page edit used by the Pages admin: title, slug, section, order and
 * status in one call. `oldSlug` is needed to revalidate the public route when
 * the slug itself changes. Returns `{ error }` so the UI can surface conflicts
 * (e.g. a duplicate slug) inline.
 */
export async function updatePage(
  id: string,
  oldSlug: string,
  patch: {
    slug?: string;
    title?: LocaleMap;
    nav_section?: NavSection;
    nav_order?: number;
    parent_id?: string | null;
    status?: PageStatus;
  },
) {
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.nav_section !== undefined) update.nav_section = patch.nav_section;
  if (patch.parent_id !== undefined) update.parent_id = patch.parent_id || null;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.nav_order !== undefined && Number.isFinite(patch.nav_order)) {
    update.nav_order = patch.nav_order;
  }

  let newSlug: string | undefined;
  if (patch.slug !== undefined) {
    newSlug = patch.slug.trim();
    if (!newSlug) return { error: 'Slug cannot be empty.' };
    update.slug = newSlug;
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from('pages').update(update as never).eq('id', id);
  if (error) {
    if (error.code === '23505') return { error: 'That slug is already in use.' };
    return { error: error.message };
  }

  revalidatePath('/admin/pages');
  revalidatePublic(oldSlug);
  if (newSlug && newSlug !== oldSlug) revalidatePublic(newSlug);
  return { ok: true };
}

export async function deletePage(id: string, slug: string) {
  const supabase = await createClient();
  await supabase.from('pages').delete().eq('id', id); // blocks cascade
  revalidatePath('/admin/pages');
  revalidatePublic(slug);
}

/** Persist a new ordering for pages (id -> nav_order). Used by drag-to-reorder. */
export async function reorderPages(items: { id: string; nav_order: number }[]) {
  const supabase = await createClient();
  await Promise.all(
    items.map((it) => supabase.from('pages').update({ nav_order: it.nav_order }).eq('id', it.id)),
  );
  revalidatePath('/admin/pages');
  revalidatePublic(); // refresh the auto-built navigation
}

// ---- News ------------------------------------------------------------------
export async function createNews(formData: FormData) {
  const supabase = await createClient();
  const slug = String(formData.get('slug') ?? '').trim();
  const titleEn = String(formData.get('title_en') ?? '');
  const titleId = String(formData.get('title_id') ?? '');

  const { error } = await supabase.from('news').insert({
    slug,
    title: { en: titleEn, id: titleId },
    published_at: null, // starts as a draft until published from the editor/list
  } as never);
  if (error) {
    if (error.code === '23505') return { error: 'That slug is already in use.' };
    return { error: error.message };
  }
  revalidatePath('/admin/news');
  revalidateNews(slug);
  return { ok: true };
}

/**
 * Flexible news edit used by the News admin: slug, title, tags, cover and
 * publish date in one call. `oldSlug` lets us revalidate the public route when
 * the slug changes. Returns `{ error }` so the UI can surface conflicts inline.
 */
export async function updateNews(
  id: string,
  oldSlug: string,
  patch: {
    slug?: string;
    title?: LocaleMap;
    tags?: string[];
    cover_url?: string | null;
    published_at?: string | null;
  },
) {
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.cover_url !== undefined) update.cover_url = patch.cover_url || null;
  if (patch.published_at !== undefined) update.published_at = patch.published_at;

  let newSlug: string | undefined;
  if (patch.slug !== undefined) {
    newSlug = patch.slug.trim();
    if (!newSlug) return { error: 'Slug cannot be empty.' };
    update.slug = newSlug;
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from('news').update(update as never).eq('id', id);
  if (error) {
    if (error.code === '23505') return { error: 'That slug is already in use.' };
    return { error: error.message };
  }

  revalidatePath('/admin/news');
  revalidateNews(oldSlug);
  if (newSlug && newSlug !== oldSlug) revalidateNews(newSlug);
  return { ok: true };
}

export async function deleteNews(id: string, slug: string) {
  const supabase = await createClient();
  await supabase.from('news').delete().eq('id', id); // blocks cascade
  revalidatePath('/admin/news');
  revalidateNews(slug);
}

// ---- Blocks (live editor) --------------------------------------------------
export async function addBlock(owner: BlockOwner, type: BlockType, slug: string) {
  const supabase = await createClient();
  const def = BLOCK_META[type];
  const col = ownerColumn(owner);

  const { data: last } = await supabase
    .from('blocks')
    .select('position')
    .eq(col, owner.id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('blocks')
    .insert({ [col]: owner.id, type, position, config: def.defaultConfig, content: def.defaultContent } as never)
    .select('id')
    .single();
  if (error) return { error: error.message };
  revalidateOwner(owner, slug);
  return { ok: true, id: data?.id };
}

export async function updateBlock(
  id: string,
  owner: BlockOwner,
  slug: string,
  patch: { config?: Record<string, unknown>; content?: Record<string, unknown> },
) {
  const supabase = await createClient();
  await supabase.from('blocks').update(patch as never).eq('id', id);
  revalidateOwner(owner, slug);
}

export async function deleteBlock(id: string, owner: BlockOwner, slug: string) {
  const supabase = await createClient();
  await supabase.from('blocks').delete().eq('id', id);
  revalidateOwner(owner, slug);
}

export async function duplicateBlock(id: string, owner: BlockOwner, slug: string) {
  const supabase = await createClient();
  const { data: src } = await supabase.from('blocks').select('*').eq('id', id).single();
  if (!src) return;
  await supabase.from('blocks').insert({
    page_id: src.page_id,
    news_id: src.news_id,
    type: src.type as BlockType,
    position: src.position + 1,
    config: src.config,
    content: src.content,
  } as never);
  revalidateOwner(owner, slug);
}

/** Persist a new ordering (array of block ids in display order). */
export async function reorderBlocks(ids: string[], owner: BlockOwner, slug: string) {
  const supabase = await createClient();
  await Promise.all(
    ids.map((id, index) => supabase.from('blocks').update({ position: index }).eq('id', id)),
  );
  revalidateOwner(owner, slug);
}

/**
 * Toggle an owner's published state from the editor. Pages carry a `status`
 * enum; news uses `published_at` (set → published, null → draft).
 */
export async function setOwnerPublished(owner: BlockOwner, published: boolean, slug: string) {
  const supabase = await createClient();
  if (owner.kind === 'news') {
    await supabase
      .from('news')
      .update({ published_at: published ? new Date().toISOString() : null } as never)
      .eq('id', owner.id);
    revalidateNews(slug);
  } else {
    await supabase
      .from('pages')
      .update({ status: published ? 'published' : 'draft' })
      .eq('id', owner.id);
    revalidatePublic(slug);
  }
}
