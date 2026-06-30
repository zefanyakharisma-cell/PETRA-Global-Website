import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { FacultyExplorer, type ExplorerFaculty } from './faculties/FacultyExplorer';

interface FacultiesContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
}

/**
 * Academics explorer — faculties → study programs → courses, sourced from
 * petra_io.{faculties,study_programs,courses}. Each faculty and study program
 * deep-links to its own website. The data is fetched + nested here (server),
 * then handed to the interactive <FacultyExplorer> client component.
 */
export async function FacultiesBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as FacultiesContent;
  const display = (block.config.display as 'explorer' | 'grid') ?? 'explorer';
  const showCourses = block.config.showCourses !== false; // default on
  const onNavy = block.config.background === 'navy';
  const supabase = await createClient();

  const { data: facultyRows } = await supabase
    .from('faculties')
    .select('id,name,tagline,description,url,logo_url,cover_url,accent')
    .eq('is_active', true)
    .order('position', { ascending: true });

  const facultyIds = (facultyRows ?? []).map((f) => f.id);

  const { data: programRows } = facultyIds.length
    ? await supabase
        .from('study_programs')
        .select('id,faculty_id,name,degree,description,url')
        .eq('is_active', true)
        .in('faculty_id', facultyIds)
        .order('position', { ascending: true })
    : { data: [] };

  const programIds = (programRows ?? []).map((p) => p.id);

  const { data: courseRows } = showCourses && programIds.length
    ? await supabase
        .from('courses')
        .select('id,study_program_id,code,name,credits,semester,description')
        .in('study_program_id', programIds)
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
    programs: (programRows ?? [])
      .filter((p) => p.faculty_id === f.id)
      .map((p) => ({
        id: p.id,
        name: p.name as LocaleMap,
        degree: p.degree,
        description: p.description as LocaleMap,
        url: p.url,
        courses: (courseRows ?? [])
          .filter((cr) => cr.study_program_id === p.id)
          .map((cr) => ({
            id: cr.id,
            code: cr.code,
            name: cr.name as LocaleMap,
            credits: cr.credits,
            semester: cr.semester,
            description: cr.description as LocaleMap,
          })),
      })),
  }));

  return (
    <Section config={block.config}>
      <Container>
        {(c.heading || c.intro) && (
          <div className="mb-8 max-w-2xl">
            {c.heading && (
              <h2 className={clsx('text-3xl md:text-4xl', onNavy && 'text-white')}>{t(c.heading, locale)}</h2>
            )}
            {c.intro && (
              <p className={clsx('mt-3', onNavy ? 'text-white/70' : 'text-ink/70')}>{t(c.intro, locale)}</p>
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
            <FacultyExplorer faculties={faculties} locale={locale} display={display} showCourses={showCourses} onNavy={onNavy} />
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
