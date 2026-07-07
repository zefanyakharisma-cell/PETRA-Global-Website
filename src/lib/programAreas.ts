import type { Locale } from '@/lib/types';

/**
 * The "areas" a study program can list — courses plus the mobility/partnership
 * tracks. All four share the same underlying `courses` table (distinguished by
 * the `area` column), so an item's shape is identical regardless of area.
 *
 * Single source of truth for: the admin `courses` area picker, the faculties
 * block's "areas to show" multiselect, and the public explorer's section labels.
 */
export const PROGRAM_AREAS = [
  { value: 'course', en: 'Courses', id: 'Mata Kuliah' },
  { value: 'joint_degree', en: 'Joint Degree', id: 'Gelar Bersama' },
  { value: 'double_degree', en: 'Double Degree', id: 'Gelar Ganda' },
  { value: 'study_abroad', en: 'Study Abroad', id: 'Studi ke Luar Negeri' },
  { value: 'international_internship', en: 'International Internship', id: 'Magang Internasional' },
  { value: 'accreditation', en: 'Accreditation', id: 'Akreditasi' },
] as const;

export type ProgramArea = (typeof PROGRAM_AREAS)[number]['value'];

export const PROGRAM_AREA_VALUES: ProgramArea[] = PROGRAM_AREAS.map((a) => a.value);

const AREA_MAP = Object.fromEntries(PROGRAM_AREAS.map((a) => [a.value, a])) as Record<
  string,
  (typeof PROGRAM_AREAS)[number]
>;

/** Localized display label for an area value (falls back to the raw value). */
export function areaLabel(area: string, locale: Locale): string {
  const a = AREA_MAP[area];
  if (!a) return area;
  return locale === 'id' ? a.id : a.en;
}
