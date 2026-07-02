import { createClient } from '@/lib/supabase/server';
import type { Block, NavSection, NewsRecord, PageRecord } from '@/lib/types';

/** A published page plus its ordered blocks. */
export interface PageWithBlocks {
  page: PageRecord;
  blocks: Block[];
}

/** A published news article plus its ordered blocks. */
export interface NewsWithBlocks {
  article: NewsRecord;
  blocks: Block[];
}

export async function getNewsBySlug(slug: string): Promise<NewsWithBlocks | null> {
  const supabase = await createClient();
  const { data: article } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (!article) return null;

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('news_id', article.id)
    .order('position');

  return { article: article as NewsRecord, blocks: (blocks ?? []) as Block[] };
}

export async function getPageBySlug(slug: string): Promise<PageWithBlocks | null> {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!page) return null;

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('position');

  return { page: page as PageRecord, blocks: (blocks ?? []) as Block[] };
}

/** A node in the navigation tree — a page plus its (recursive) child pages. */
export interface NavNode {
  slug: string;
  title: PageRecord['title'];
  children: NavNode[];
}

export interface NavGroup {
  section: Exclude<NavSection, 'none'>;
  /** The section's landing page — the top-level link target (may be null). */
  landingSlug: string | null;
  /** The menu tree shown under the section (the landing page's children). */
  items: NavNode[];
}

const SECTION_ORDER: Exclude<NavSection, 'none'>[] = [
  'about',
  'mobility',
  'partnership',
  'life',
  'news',
];

/**
 * Navigation AUTO-BUILDS from published pages grouped by `nav_section`, ordered
 * by `nav_order`. Within a section, pages nest into a tree via `parent_id`, so
 * the menu can be arbitrarily layered (section → subsection → item).
 *
 * A section whose pages form a single root (parent_id = null) treats that root
 * as the landing page: the top-level nav links to it and its children fill the
 * dropdown. A section with several roots keeps the older flat behaviour (the
 * top-level links to the first, all roots list beneath it).
 */
export async function getNavigation(): Promise<NavGroup[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pages')
    .select('id,slug,title,nav_section,nav_order,parent_id')
    .eq('status', 'published')
    .neq('nav_section', 'none')
    .order('nav_order');

  const rows = data ?? [];

  const groups = SECTION_ORDER.map((section): NavGroup | null => {
    const sectionRows = rows.filter((r) => r.nav_section === section);
    if (sectionRows.length === 0) return null;

    // Build the tree. Rows arrive ordered by nav_order, so pushing children in
    // iteration order keeps siblings correctly sorted.
    const nodeById = new Map<string, NavNode>();
    for (const r of sectionRows) {
      nodeById.set(r.id, { slug: r.slug, title: r.title as PageRecord['title'], children: [] });
    }

    const roots: NavNode[] = [];
    for (const r of sectionRows) {
      const node = nodeById.get(r.id)!;
      // A page whose parent lives outside this published section is a root here.
      const parent = r.parent_id ? nodeById.get(r.parent_id) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }

    if (roots.length === 1) {
      return { section, landingSlug: roots[0].slug, items: roots[0].children };
    }
    return { section, landingSlug: roots[0]?.slug ?? null, items: roots };
  });

  return groups.filter((g): g is NavGroup => g !== null && (g.landingSlug !== null || g.items.length > 0));
}

/** Published page slugs for static generation. */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pages')
    .select('slug')
    .eq('status', 'published');
  return (data ?? []).map((p) => p.slug);
}
