import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { FacultyExplorer, type ExplorerFaculty, type FacultyDisplay } from './faculties/FacultyExplorer';
import { PROGRAM_AREA_VALUES } from '@/lib/programAreas';

interface FacultiesContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
}

/** Coerce a config value into a clean string[] (block config is loosely typed). */
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/**
 * Academics explorer — faculties → study programs → courses, sourced from
 * petra_io.{faculties,study_programs,courses}. Each faculty and study program
 * deep-links to its own website. The data is fetched + nested here (server),
 * then handed to the interactive <FacultyExplorer> client component.
 */
export async function FacultiesBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as FacultiesContent;
  const display = (block.config.display as FacultyDisplay) ?? 'explorer';
  // Which areas (courses / joint degree / …) to list under each program.
  // Back-compat: older blocks stored a `showCourses` boolean instead of `areas`.
  const areas = 'areas' in block.config
    ? asStringArray(block.config.areas).filter((a) => PROGRAM_AREA_VALUES.includes(a as never))
    : block.config.showCourses !== false
      ? ['course']
      : [];
  // Optional per-block filters — empty means "show all".
  const pickFaculties = asStringArray(block.config.facultyIds);
  const pickPrograms = asStringArray(block.config.programIds);
  const onNavy = isDarkBg(block.config.background);
  const supabase = await createClient();

  let facultyQuery = supabase
    .from('faculties')
    .select('id,name,tagline,description,url,logo_url,cover_url,accent')
    .eq('is_active', true)
    .order('position', { ascending: true });
  if (pickFaculties.length) facultyQuery = facultyQuery.in('id', pickFaculties);
  const { data: facultyRows } = await facultyQuery;

  const facultyIds = (facultyRows ?? []).map((f) => f.id);

  let programRows: { id: string; faculty_id: string | null; name: unknown; degree: string | null; description: unknown; url: string | null }[] = [];
  if (facultyIds.length) {
    let programQuery = supabase
      .from('study_programs')
      .select('id,faculty_id,name,degree,description,url')
      .eq('is_active', true)
      .in('faculty_id', facultyIds)
      .order('position', { ascending: true });
    if (pickPrograms.length) programQuery = programQuery.in('id', pickPrograms);
    const { data } = await programQuery;
    programRows = data ?? [];
  }

  const programIds = programRows.map((p) => p.id);

  const { data: courseRows } = areas.length && programIds.length
    ? await supabase
        .from('courses')
        .select('id,study_program_id,area,code,name,credits,semester,description,meta')
        .eq('is_active', true)
        .in('study_program_id', programIds)
        .in('area', areas)
        .order('position', { ascending: true })
    : { data: [] };

  // Nest courses under programs, programs under faculties.
  const faculties: ExplorerFaculty[] = (facultyRows ?? []).map((f) => ({
    id: f.id,
    name: f.name as LocaleMap,
    tagline: f.tagline as LocaleMap,
    description: f.description as LocaleMap,
    url: f.url,
    logo_url: f.logo_url,
    cover_url: f.cover_url,
    accent: f.accent,
    programs: programRows
      .filter((p) => p.faculty_id === f.id)
      .map((p) => ({
        id: p.id,
        name: p.name as LocaleMap,
        degree: p.degree,
        description: p.description as LocaleMap,
        url: p.url,
        items: (courseRows ?? [])
          .filter((cr) => cr.study_program_id === p.id)
          .map((cr) => ({
            id: cr.id,
            area: cr.area,
            code: cr.code,
            name: cr.name as LocaleMap,
            credits: cr.credits,
            semester: cr.semester,
            description: cr.description as LocaleMap,
            meta: (cr.meta ?? {}) as Record<string, string>,
          })),
      })),
  }));

  return (
    <Section config={block.config}>
      <Container>
        {(c.heading || c.intro) && (
          <div className="mb-8 max-w-2xl">
            {t(c.heading, locale) && (
              <InlineHtml as="h2" html={t(c.heading, locale)} className={clsx('text-3xl md:text-4xl', onNavy && 'text-white')} />
            )}
            {t(c.intro, locale) && (
              <RichText html={t(c.intro, locale)} onNavy={onNavy} className={clsx('mt-3', !onNavy && 'text-ink/70')} />
            )}
          </div>
        )}

        {faculties.length === 0 ? (
          <EmptyState
            onDark={onNavy}
            title={locale === 'id' ? 'Belum ada fakultas' : 'No faculties published yet'}
            hint={locale === 'id' ? 'Tambahkan fakultas & program studi di panel admin.' : 'Add faculties and study programs in the admin panel.'}
          />
        ) : (
          <Reveal>
            <FacultyExplorer faculties={faculties} locale={locale} display={display} areas={areas} onNavy={onNavy} />
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
