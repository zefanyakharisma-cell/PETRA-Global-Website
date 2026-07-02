import type { EntityOptions } from '@/components/admin/BlockForm';
import { t, type LocaleMap } from '@/lib/types';
import type { createClient } from './server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads the dropdown/checkbox options that power the block editor's entity
 * pickers (staff, programs, faculties, study programs). Shared by the page and
 * news editors so both stay in sync as new entity-bound blocks are added.
 */
export async function loadEditorEntities(supabase: Supabase): Promise<EntityOptions> {
  const [{ data: staffRows }, { data: programRows }, { data: facultyRows }, { data: spRows }] = await Promise.all([
    supabase.from('staff').select('id, name').order('name'),
    supabase.from('programs').select('id, slug, title'),
    supabase.from('faculties').select('id, slug, name').order('position'),
    supabase.from('study_programs').select('id, slug, name').order('position'),
  ]);

  return {
    staff: (staffRows ?? []).map((s) => ({ id: s.id as string, label: (s.name as string) ?? s.id })),
    programs: (programRows ?? []).map((pr) => ({
      id: pr.id as string,
      label: t(pr.title as LocaleMap, 'en') || (pr.slug as string) || (pr.id as string),
    })),
    faculties: (facultyRows ?? []).map((f) => ({
      id: f.id as string,
      label: t(f.name as LocaleMap, 'en') || (f.slug as string) || (f.id as string),
    })),
    study_programs: (spRows ?? []).map((sp) => ({
      id: sp.id as string,
      label: t(sp.name as LocaleMap, 'en') || (sp.slug as string) || (sp.id as string),
    })),
  };
}
