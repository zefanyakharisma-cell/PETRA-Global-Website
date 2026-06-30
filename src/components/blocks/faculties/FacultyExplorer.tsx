'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap, type Locale } from '@/lib/types';

export interface ExplorerCourse {
  id: string;
  code: string | null;
  name: LocaleMap;
  credits: number | null;
  semester: string | null;
  description: LocaleMap;
}

export interface ExplorerProgram {
  id: string;
  name: LocaleMap;
  degree: string | null;
  description: LocaleMap;
  url: string | null;
  courses: ExplorerCourse[];
}

export interface ExplorerFaculty {
  id: string;
  name: LocaleMap;
  tagline: LocaleMap;
  description: LocaleMap;
  url: string | null;
  logo_url: string | null;
  cover_url: string | null;
  accent: string;
  programs: ExplorerProgram[];
}

type Accent = { bar: string; ring: string; chip: string; dot: string };

const ACCENT: Record<string, Accent> = {
  magenta: { bar: 'bg-magenta', ring: 'hover:border-magenta/60', chip: 'bg-magenta text-white', dot: 'text-magenta' },
  blue: { bar: 'bg-blue', ring: 'hover:border-blue/60', chip: 'bg-blue text-white', dot: 'text-blue' },
  amber: { bar: 'bg-amber', ring: 'hover:border-amber/60', chip: 'bg-amber text-ink', dot: 'text-amber' },
  cyan: { bar: 'bg-cyan', ring: 'hover:border-cyan/60', chip: 'bg-cyan text-ink', dot: 'text-ink' },
  red: { bar: 'bg-red', ring: 'hover:border-red/60', chip: 'bg-red text-white', dot: 'text-red' },
  orange: { bar: 'bg-orange', ring: 'hover:border-orange/60', chip: 'bg-orange text-white', dot: 'text-orange' },
  green: { bar: 'bg-green', ring: 'hover:border-green/60', chip: 'bg-green text-ink', dot: 'text-green' },
  yellow: { bar: 'bg-yellow', ring: 'hover:border-yellow/60', chip: 'bg-yellow text-ink', dot: 'text-ink' },
};

const LABELS = {
  en: {
    visitFaculty: 'Visit faculty website',
    visitProgram: 'Visit website',
    programs: 'Study programs',
    program: 'study program',
    programsPlural: 'study programs',
    courses: 'Courses',
    viewCourses: 'View courses',
    hideCourses: 'Hide courses',
    noPrograms: 'Study programs will appear here soon.',
    noCourses: 'Course list coming soon.',
    credits: 'Credits',
    semester: 'Sem.',
    explore: 'Explore',
  },
  id: {
    visitFaculty: 'Kunjungi situs fakultas',
    visitProgram: 'Kunjungi situs',
    programs: 'Program studi',
    program: 'program studi',
    programsPlural: 'program studi',
    courses: 'Mata kuliah',
    viewCourses: 'Lihat mata kuliah',
    hideCourses: 'Sembunyikan mata kuliah',
    noPrograms: 'Program studi akan segera tampil di sini.',
    noCourses: 'Daftar mata kuliah akan segera hadir.',
    credits: 'SKS',
    semester: 'Sem.',
    explore: 'Jelajahi',
  },
} as const;

function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

/** Collapsible panel that animates open/closed (honours reduced motion). */
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduce ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CourseTable({ courses, locale, onNavy }: { courses: ExplorerCourse[]; locale: Locale; onNavy: boolean }) {
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  if (courses.length === 0) {
    return <p className={clsx('px-4 py-3 text-sm', onNavy ? 'text-white/50' : 'text-ink/50')}>{L.noCourses}</p>;
  }
  return (
    <ul className="space-y-2">
      {courses.map((c) => (
        <li
          key={c.id}
          className={clsx(
            'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm',
            onNavy ? 'bg-white/5' : 'bg-paper',
          )}
        >
          {c.code && (
            <span className={clsx('font-condensed uppercase tracking-wide', onNavy ? 'text-cyan' : 'text-magenta')}>
              {c.code}
            </span>
          )}
          <span className={clsx('flex-1 min-w-[8rem]', onNavy ? 'text-white' : 'text-ink')}>{t(c.name, locale)}</span>
          {c.semester && (
            <span className={clsx('text-xs', onNavy ? 'text-white/50' : 'text-ink/50')}>
              {L.semester} {c.semester}
            </span>
          )}
          {c.credits != null && (
            <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', onNavy ? 'bg-white/10 text-white/80' : 'bg-ink/10 text-ink/70')}>
              {c.credits} {L.credits}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ProgramRow({
  program,
  locale,
  accent,
  showCourses,
  onNavy,
}: {
  program: ExplorerProgram;
  locale: Locale;
  accent: Accent;
  showCourses: boolean;
  onNavy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  const hasCourses = showCourses;
  const desc = t(program.description, locale);

  return (
    <div className={clsx('rounded-xl border p-4', onNavy ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-white')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[12rem] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={clsx('text-xl', onNavy && 'text-white')}>{t(program.name, locale)}</h4>
            {program.degree && (
              <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', accent.chip)}>{program.degree}</span>
            )}
          </div>
          {desc && <p className={clsx('mt-1 text-sm', onNavy ? 'text-white/65' : 'text-ink/65')}>{desc}</p>}
        </div>
        <div className="flex items-center gap-2">
          {program.url && (
            <ExternalLink
              href={program.url}
              className={clsx(
                'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-condensed uppercase tracking-wide transition',
                onNavy ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-navy text-white hover:bg-navy-2',
              )}
            >
              {L.visitProgram} ↗
            </ExternalLink>
          )}
          {hasCourses && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={clsx(
                'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-condensed uppercase tracking-wide transition',
                onNavy ? 'border-white/20 text-white hover:bg-white/10' : 'border-ink/20 text-ink hover:bg-ink/5',
              )}
            >
              {open ? L.hideCourses : L.viewCourses}
              <span className={clsx('transition-transform', open && 'rotate-180')}>▾</span>
            </button>
          )}
        </div>
      </div>
      {hasCourses && (
        <Collapse open={open}>
          <div className="pt-3">
            <CourseTable courses={program.courses} locale={locale} onNavy={onNavy} />
          </div>
        </Collapse>
      )}
    </div>
  );
}

function FacultyPanel({
  faculty,
  locale,
  showCourses,
  onNavy,
  defaultOpen,
}: {
  faculty: ExplorerFaculty;
  locale: Locale;
  showCourses: boolean;
  onNavy: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  const accent = ACCENT[faculty.accent] ?? ACCENT.magenta;
  const count = faculty.programs.length;

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl border-2 transition',
        onNavy ? 'border-white/10 bg-white/5' : 'border-ink/10 bg-white',
        accent.ring,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 p-5 text-left md:p-6"
      >
        <span className={clsx('h-12 w-1.5 shrink-0 rounded-full', accent.bar)} />
        {faculty.logo_url && (
          <span className="relative hidden h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10 sm:block">
            <Image src={faculty.logo_url} alt="" fill className="object-contain p-1" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={clsx('block text-2xl leading-tight md:text-3xl', onNavy && 'text-white')}>
            {t(faculty.name, locale)}
          </span>
          {t(faculty.tagline, locale) && (
            <span className={clsx('mt-0.5 block text-sm', onNavy ? 'text-white/60' : 'text-ink/60')}>
              {t(faculty.tagline, locale)}
            </span>
          )}
        </span>
        <span className={clsx('hidden shrink-0 font-condensed text-sm uppercase tracking-wide sm:block', onNavy ? 'text-white/50' : 'text-ink/45')}>
          {count} {count === 1 ? L.program : L.programsPlural}
        </span>
        <span className={clsx('shrink-0 text-2xl transition-transform', accent.dot, open && 'rotate-180')}>▾</span>
      </button>

      <Collapse open={open}>
        <div className={clsx('border-t px-5 pb-6 pt-5 md:px-6', onNavy ? 'border-white/10' : 'border-ink/10')}>
          {(t(faculty.description, locale) || faculty.url) && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              {t(faculty.description, locale) && (
                <p className={clsx('max-w-2xl text-sm', onNavy ? 'text-white/70' : 'text-ink/70')}>
                  {t(faculty.description, locale)}
                </p>
              )}
              {faculty.url && (
                <ExternalLink
                  href={faculty.url}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-md px-4 py-2 font-condensed uppercase tracking-wide text-white transition',
                    accent.bar,
                    'hover:brightness-110',
                  )}
                >
                  {L.visitFaculty} ↗
                </ExternalLink>
              )}
            </div>
          )}
          {count === 0 ? (
            <p className={clsx('text-sm', onNavy ? 'text-white/50' : 'text-ink/50')}>{L.noPrograms}</p>
          ) : (
            <div className="grid gap-3">
              {faculty.programs.map((p) => (
                <ProgramRow key={p.id} program={p} locale={locale} accent={accent} showCourses={showCourses} onNavy={onNavy} />
              ))}
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
}

/** Grid mode — compact faculty cards that link straight to each faculty site. */
function FacultyCard({ faculty, locale, onNavy }: { faculty: ExplorerFaculty; locale: Locale; onNavy: boolean }) {
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  const accent = ACCENT[faculty.accent] ?? ACCENT.magenta;
  const count = faculty.programs.length;

  const inner = (
    <div
      className={clsx(
        'group flex h-full flex-col rounded-2xl border-2 p-6 transition hover:-translate-y-1 hover:shadow-lg',
        onNavy ? 'border-white/10 bg-white/5' : 'border-ink/10 bg-white',
        accent.ring,
      )}
    >
      <span className={clsx('h-1.5 w-12 rounded-full', accent.bar)} />
      <h3 className={clsx('mt-5 text-2xl', onNavy && 'text-white')}>{t(faculty.name, locale)}</h3>
      {t(faculty.tagline, locale) && (
        <p className={clsx('mt-2 text-sm', onNavy ? 'text-white/65' : 'text-ink/65')}>{t(faculty.tagline, locale)}</p>
      )}
      <span className={clsx('mt-auto pt-6 font-condensed text-sm uppercase tracking-wide', onNavy ? 'text-white/50' : 'text-ink/45')}>
        {count} {count === 1 ? L.program : L.programsPlural}
        {faculty.url ? ` · ${L.explore} ↗` : ''}
      </span>
    </div>
  );

  if (faculty.url) return <ExternalLink href={faculty.url}>{inner}</ExternalLink>;
  return inner;
}

export function FacultyExplorer({
  faculties,
  locale,
  display,
  showCourses,
  onNavy,
}: {
  faculties: ExplorerFaculty[];
  locale: Locale;
  display: 'explorer' | 'grid';
  showCourses: boolean;
  onNavy: boolean;
}) {
  if (display === 'grid') {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {faculties.map((f) => (
          <FacultyCard key={f.id} faculty={f} locale={locale} onNavy={onNavy} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {faculties.map((f, i) => (
        <FacultyPanel key={f.id} faculty={f} locale={locale} showCourses={showCourses} onNavy={onNavy} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
