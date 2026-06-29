import { createClient } from '@/lib/supabase/server';
import type { Block, NavSection, PageRecord } from '@/lib/types';

/** A published page plus its ordered blocks. */
export interface PageWithBlocks {
  page: PageRecord;
  blocks: Block[];
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

export interface NavItem {
  slug: string;
  title: PageRecord['title'];
  section: NavSection;
  order: number;
  parentId: string | null;
}

export interface NavGroup {
  section: Exclude<NavSection, 'none'>;
  items: NavItem[];
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
 * by `nav_order`. Adding a published page to a section makes it appear here.
 */
export async function getNavigation(): Promise<NavGroup[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pages')
    .select('slug,title,nav_section,nav_order,parent_id')
    .eq('status', 'published')
    .neq('nav_section', 'none')
    .order('nav_order');

  const rows = data ?? [];
  return SECTION_ORDER.map((section) => ({
    section,
    items: rows
      .filter((r) => r.nav_section === section)
      .map((r) => ({
        slug: r.slug,
        title: r.title as PageRecord['title'],
        section: r.nav_section as NavSection,
        order: r.nav_order,
        parentId: r.parent_id,
      })),
  })).filter((g) => g.items.length > 0);
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
