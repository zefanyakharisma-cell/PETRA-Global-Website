'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap, type Locale } from '@/lib/types';
import { areaLabel } from '@/lib/programAreas';

export interface ExplorerItem {
  id: string;
  area: string;
  code: string | null;
  name: LocaleMap;
  credits: number | null;
  semester: string | null;
  description: LocaleMap;
  /** Area-specific attributes (partner/host institution, country, credential, duration, detail). */
  meta: Record<string, string>;
}

export interface ExplorerProgram {
  id: string;
  name: LocaleMap;
  degree: string | null;
  description: LocaleMap;
  url: string | null;
  items: ExplorerItem[];
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
    noPrograms: 'Study programs will appear here soon.',
    noItems: 'Nothing listed here yet.',
    credits: 'Credits',
    semester: 'Sem.',
    explore: 'Explore',
    searchPlaceholder: 'Search by program or opportunity…',
    all: 'All',
    opportunity: 'opportunity',
    opportunities: 'opportunities',
    across: 'across',
    programsLower: 'programs',
    noResults: 'No matching opportunities. Try another keyword or filter.',
    clear: 'Clear',
  },
  id: {
    visitFaculty: 'Kunjungi situs fakultas',
    visitProgram: 'Kunjungi situs',
    programs: 'Program studi',
    program: 'program studi',
    programsPlural: 'program studi',
    noPrograms: 'Program studi akan segera tampil di sini.',
    noItems: 'Belum ada yang tercantum di sini.',
    credits: 'SKS',
    semester: 'Sem.',
    explore: 'Jelajahi',
    searchPlaceholder: 'Cari berdasarkan program atau peluang…',
    all: 'Semua',
    opportunity: 'peluang',
    opportunities: 'peluang',
    across: 'di',
    programsLower: 'program',
    noResults: 'Tidak ada peluang yang cocok. Coba kata kunci atau filter lain.',
    clear: 'Hapus',
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

/**
 * A single program-item row, rendered per its area so each type is presented
 * with the right fields. Courses keep their code / semester / credits look;
 * the mobility & partnership areas lead with an institution · country subtitle
 * and show their credential / duration / detail as badges. Shared by the
 * accordion (ItemTable) and the opportunity finder — pass `areaChipClass` to
 * prefix the row with an area badge (the finder's flat list needs it).
 */
function ItemRow({
  item,
  locale,
  onNavy,
  areaChipClass,
}: {
  item: ExplorerItem;
  locale: Locale;
  onNavy: boolean;
  areaChipClass?: string;
}) {
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  const isCourse = item.area === 'course';
  const subtitle = [item.meta.institution, item.meta.country].filter(Boolean).join(' · ');
  const badges = isCourse ? [] : [item.meta.credential, item.meta.duration, item.meta.detail].filter(Boolean);
  const pill = clsx('rounded-full px-2 py-0.5 text-xs font-medium', onNavy ? 'bg-white/10 text-white/80' : 'bg-ink/10 text-ink/70');

  return (
    <li className={clsx('flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm', onNavy ? 'bg-white/5' : 'bg-paper')}>
      {areaChipClass && <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', areaChipClass)}>{areaLabel(item.area, locale)}</span>}
      {item.code && (
        <span className={clsx('font-condensed uppercase tracking-wide', onNavy ? 'text-cyan' : 'text-magenta')}>{item.code}</span>
      )}
      <span className="flex-1 min-w-[8rem]">
        <span className={clsx('block', onNavy ? 'text-white' : 'text-ink')}>{t(item.name, locale)}</span>
        {subtitle && <span className={clsx('block text-xs', onNavy ? 'text-white/50' : 'text-ink/50')}>{subtitle}</span>}
      </span>
      {isCourse && item.semester && (
        <span className={clsx('text-xs', onNavy ? 'text-white/50' : 'text-ink/50')}>{L.semester} {item.semester}</span>
      )}
      {isCourse && item.credits != null && <span className={pill}>{item.credits} {L.credits}</span>}
      {badges.map((b) => <span key={b} className={pill}>{b}</span>)}
    </li>
  );
}

function ItemTable({ items, locale, onNavy }: { items: ExplorerItem[]; locale: Locale; onNavy: boolean }) {
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  if (items.length === 0) {
    return <p className={clsx('px-4 py-3 text-sm', onNavy ? 'text-white/50' : 'text-ink/50')}>{L.noItems}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <ItemRow key={c.id} item={c} locale={locale} onNavy={onNavy} />
      ))}
    </ul>
  );
}

function ProgramRow({
  program,
  locale,
  accent,
  areas,
  onNavy,
}: {
  program: ExplorerProgram;
  locale: Locale;
  accent: Accent;
  areas: string[];
  onNavy: boolean;
}) {
  // One collapsible section per selected area that actually has items, kept in
  // the order the editor chose the areas. Single-open accordion within a row.
  const groups = areas
    .map((area) => ({ area, items: program.items.filter((it) => it.area === area) }))
    .filter((g) => g.items.length > 0);
  const [openArea, setOpenArea] = useState<string | null>(null);
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
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
        <div className="flex flex-wrap items-center gap-2">
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
          {groups.map((g) => {
            const open = openArea === g.area;
            return (
              <button
                key={g.area}
                type="button"
                onClick={() => setOpenArea((v) => (v === g.area ? null : g.area))}
                aria-expanded={open}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-condensed uppercase tracking-wide transition',
                  open
                    ? accent.chip
                    : onNavy
                      ? 'border-white/20 text-white hover:bg-white/10'
                      : 'border-ink/20 text-ink hover:bg-ink/5',
                )}
              >
                {areaLabel(g.area, locale)}
                <span className={clsx('transition-transform', open && 'rotate-180')}>▾</span>
              </button>
            );
          })}
        </div>
      </div>
      {groups.map((g) => (
        <Collapse key={g.area} open={openArea === g.area}>
          <div className="pt-3">
            <ItemTable items={g.items} locale={locale} onNavy={onNavy} />
          </div>
        </Collapse>
      ))}
    </div>
  );
}

function FacultyPanel({
  faculty,
  locale,
  areas,
  onNavy,
  defaultOpen,
}: {
  faculty: ExplorerFaculty;
  locale: Locale;
  areas: string[];
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
                <ProgramRow key={p.id} program={p} locale={locale} accent={accent} areas={areas} onNavy={onNavy} />
              ))}
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
}

/** List mode — dense, scannable directory rows that link to each faculty site. */
function FacultyListRow({ faculty, locale, onNavy }: { faculty: ExplorerFaculty; locale: Locale; onNavy: boolean }) {
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  const accent = ACCENT[faculty.accent] ?? ACCENT.magenta;
  const count = faculty.programs.length;

  const inner = (
    <div
      className={clsx(
        'group flex items-center gap-4 px-4 py-4 transition sm:px-5',
        onNavy ? 'hover:bg-white/[0.04]' : 'hover:bg-paper',
      )}
    >
      <span className={clsx('h-10 w-1.5 shrink-0 rounded-full', accent.bar)} />
      {faculty.logo_url && (
        <span className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10 sm:block">
          <Image src={faculty.logo_url} alt="" fill className="object-contain p-1" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={clsx('block text-lg leading-tight md:text-xl', onNavy && 'text-white')}>
          {t(faculty.name, locale)}
        </span>
        {t(faculty.tagline, locale) && (
          <span className={clsx('mt-0.5 block truncate text-sm', onNavy ? 'text-white/60' : 'text-ink/60')}>
            {t(faculty.tagline, locale)}
          </span>
        )}
      </span>
      <span className={clsx('hidden shrink-0 font-condensed text-sm uppercase tracking-wide sm:block', onNavy ? 'text-white/50' : 'text-ink/45')}>
        {count} {count === 1 ? L.program : L.programsPlural}
      </span>
      {faculty.url && (
        <span className={clsx('shrink-0 text-lg transition-transform group-hover:translate-x-0.5', accent.dot)}>↗</span>
      )}
    </div>
  );

  if (faculty.url) return <ExternalLink href={faculty.url}>{inner}</ExternalLink>;
  return inner;
}

/** Cover mode — image-forward tiles using each faculty's cover image. */
function FacultyCoverCard({ faculty, locale, onNavy }: { faculty: ExplorerFaculty; locale: Locale; onNavy: boolean }) {
  const L = LABELS[locale === 'id' ? 'id' : 'en'];
  const accent = ACCENT[faculty.accent] ?? ACCENT.magenta;
  const count = faculty.programs.length;

  const inner = (
    <div
      className={clsx(
        'group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-lg',
        onNavy ? 'ring-1 ring-white/10' : 'ring-1 ring-ink/10',
      )}
    >
      {faculty.cover_url ? (
        <Image
          src={faculty.cover_url}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className={clsx('absolute inset-0', accent.bar)} />
      )}
      {/* Gradient scrim so text stays legible over any image. */}
      <span className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
      <span className={clsx('absolute left-4 top-4 h-1.5 w-10 rounded-full', accent.bar)} />
      <div className="relative p-5">
        <h3 className="text-2xl leading-tight text-white">{t(faculty.name, locale)}</h3>
        {t(faculty.tagline, locale) && (
          <p className="mt-1 text-sm text-white/75">{t(faculty.tagline, locale)}</p>
        )}
        <span className="mt-3 block font-condensed text-sm uppercase tracking-wide text-white/60">
          {count} {count === 1 ? L.program : L.programsPlural}
          {faculty.url ? ` · ${L.explore} ↗` : ''}
        </span>
      </div>
    </div>
  );

  if (faculty.url) return <ExternalLink href={faculty.url} className="block h-full">{inner}</ExternalLink>;
  return inner;
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

/**
 * Finder mode — flips the explorer hierarchy for opportunity-seekers. Instead of
 * drilling faculty → program → area, the audience searches by keyword and filters
 * by area (e.g. International Internship, Study Abroad), then sees every matching
 * opportunity across all faculties in one flat list, each still tied to its
 * study program and faculty so they know it fits their field.
 */
function FacultyFinder({
  faculties,
  locale,
  areas,
  onNavy,
}: {
  faculties: ExplorerFaculty[];
  locale: Locale;
  areas: string[];
  onNavy: boolean;
}) {
  const L = LABELS[locale === 'id' ? 'id' : 'en'];

  // Flatten to (faculty, program, items) entries, keeping only the chosen areas.
  const entries = useMemo(() => {
    const out: { faculty: ExplorerFaculty; program: ExplorerProgram; items: ExplorerItem[] }[] = [];
    for (const f of faculties) {
      for (const p of f.programs) {
        const items = p.items.filter((it) => areas.includes(it.area));
        if (items.length) out.push({ faculty: f, program: p, items });
      }
    }
    return out;
  }, [faculties, areas]);

  // Only offer area filters that actually have items, in the editor's chosen order.
  const availableAreas = useMemo(
    () => areas.filter((a) => entries.some((e) => e.items.some((it) => it.area === a))),
    [areas, entries],
  );

  const [activeArea, setActiveArea] = useState<string>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    return entries
      .map((e) => {
        const items = e.items.filter((it) => {
          if (activeArea !== 'all' && it.area !== activeArea) return false;
          if (!q) return true;
          const hay = [t(e.program.name, locale), t(e.faculty.name, locale), t(it.name, locale), it.code ?? '']
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
        return { ...e, items };
      })
      .filter((e) => e.items.length > 0);
  }, [entries, activeArea, q, locale]);

  const total = results.reduce((n, e) => n + e.items.length, 0);
  const showAreaFilter = availableAreas.length > 1;

  const chip = (active: boolean) =>
    clsx(
      'inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-condensed uppercase tracking-wide transition',
      active
        ? 'border-transparent bg-navy text-white'
        : onNavy
          ? 'border-white/20 text-white/80 hover:bg-white/10'
          : 'border-ink/20 text-ink/70 hover:bg-ink/5',
    );

  return (
    <div>
      {/* Search + area filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className={clsx('pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2', onNavy ? 'text-white/40' : 'text-ink/40')}
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              d="M8.5 3a5.5 5.5 0 1 0 3.9 9.4l4.1 4.1M8.5 3a5.5 5.5 0 0 1 3.9 9.4"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={L.searchPlaceholder}
            aria-label={L.searchPlaceholder}
            className={clsx(
              'w-full rounded-xl border py-3 pl-11 pr-10 text-base outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15',
              onNavy ? 'border-white/15 bg-white/5 text-white placeholder:text-white/40' : 'border-ink/15 bg-white text-ink placeholder:text-ink/40',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={L.clear}
              className={clsx('absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none', onNavy ? 'text-white/50 hover:text-white' : 'text-ink/40 hover:text-ink')}
            >
              ×
            </button>
          )}
        </div>

        {showAreaFilter && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveArea('all')} aria-pressed={activeArea === 'all'} className={chip(activeArea === 'all')}>
              {L.all}
            </button>
            {availableAreas.map((a) => (
              <button key={a} type="button" onClick={() => setActiveArea(a)} aria-pressed={activeArea === a} className={chip(activeArea === a)}>
                {areaLabel(a, locale)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className={clsx('mt-4 text-sm', onNavy ? 'text-white/55' : 'text-ink/55')} aria-live="polite">
        {total} {total === 1 ? L.opportunity : L.opportunities} {L.across} {results.length} {L.programsLower}
      </p>

      {/* Results */}
      {results.length === 0 ? (
        <p className={clsx('mt-6 rounded-xl border border-dashed px-4 py-8 text-center text-sm', onNavy ? 'border-white/15 text-white/55' : 'border-ink/15 text-ink/55')}>
          {L.noResults}
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {results.map((e) => {
            const accent = ACCENT[e.faculty.accent] ?? ACCENT.magenta;
            return (
              <div key={e.program.id} className={clsx('rounded-xl border p-4', onNavy ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-white')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[12rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={clsx('text-lg md:text-xl', onNavy && 'text-white')}>{t(e.program.name, locale)}</h4>
                      {e.program.degree && (
                        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', accent.chip)}>{e.program.degree}</span>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 flex items-center gap-1.5 text-sm', onNavy ? 'text-white/55' : 'text-ink/55')}>
                      <span className={clsx('inline-block h-2 w-2 rounded-full', accent.bar)} />
                      {t(e.faculty.name, locale)}
                    </span>
                  </div>
                  {e.program.url && (
                    <ExternalLink
                      href={e.program.url}
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-condensed uppercase tracking-wide transition',
                        onNavy ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-navy text-white hover:bg-navy-2',
                      )}
                    >
                      {L.visitProgram} ↗
                    </ExternalLink>
                  )}
                </div>
                <ul className="mt-3 space-y-2">
                  {/* Area badge leads each row — it's the finder audience's primary lens. */}
                  {e.items.map((it) => (
                    <ItemRow key={it.id} item={it} locale={locale} onNavy={onNavy} areaChipClass={accent.chip} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type FacultyDisplay = 'explorer' | 'grid' | 'list' | 'cover' | 'opportunities';

export function FacultyExplorer({
  faculties,
  locale,
  display,
  areas,
  onNavy,
}: {
  faculties: ExplorerFaculty[];
  locale: Locale;
  display: FacultyDisplay;
  areas: string[];
  onNavy: boolean;
}) {
  if (display === 'opportunities') {
    return <FacultyFinder faculties={faculties} locale={locale} areas={areas} onNavy={onNavy} />;
  }

  if (display === 'grid') {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {faculties.map((f) => (
          <FacultyCard key={f.id} faculty={f} locale={locale} onNavy={onNavy} />
        ))}
      </div>
    );
  }

  if (display === 'cover') {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {faculties.map((f) => (
          <FacultyCoverCard key={f.id} faculty={f} locale={locale} onNavy={onNavy} />
        ))}
      </div>
    );
  }

  if (display === 'list') {
    return (
      <div className={clsx('divide-y overflow-hidden rounded-2xl border', onNavy ? 'divide-white/10 border-white/10' : 'divide-ink/10 border-ink/10')}>
        {faculties.map((f) => (
          <FacultyListRow key={f.id} faculty={f} locale={locale} onNavy={onNavy} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {faculties.map((f, i) => (
        <FacultyPanel key={f.id} faculty={f} locale={locale} areas={areas} onNavy={onNavy} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
