import { PROGRAM_AREAS } from '@/lib/programAreas';

/** Field schema driving the generic entity admin (list + create form). */
export type EntityTable =
  | 'staff'
  | 'programs'
  | 'partners'
  | 'domestic_partners'
  | 'news'
  | 'testimonials'
  | 'faculties'
  | 'study_programs'
  | 'courses';

export type FieldKind =
  | 'text'
  | 'email'
  | 'number'
  | 'bool'
  | 'localized'
  | 'url'
  | 'tags'
  | 'date'
  | 'select'
  | 'relation';

/** A `select` option — a bare string (value === label) or an explicit pair. */
export type SelectOption = string | { value: string; label: string };

export function optionValue(o: SelectOption): string {
  return typeof o === 'string' ? o : o.value;
}
export function optionLabel(o: SelectOption): string {
  return typeof o === 'string' ? o : o.label;
}

/**
 * Fields whose key is `meta.<subkey>` are stored inside the row's `meta` jsonb
 * column rather than a dedicated column. This lets area-specific attributes
 * (partner university, country, grade, …) live on the shared `courses` table
 * without a column per area. See `areaFields` on the courses config.
 */
export function isMetaField(key: string): boolean {
  return key.startsWith('meta.');
}
export function metaSubkey(key: string): string {
  return key.slice('meta.'.length);
}

export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
  options?: SelectOption[];
  /** For `relation` fields — the parent table whose rows populate the dropdown. */
  relTable?: EntityTable;
  required?: boolean;
}

export interface EntityConfig {
  table: EntityTable;
  title: string;
  /** Columns shown in the list table (plain or localized → shown as EN). */
  list: string[];
  /**
   * The union of every field the table can store. Drives the list rendering and
   * the server-side record builder. For area-aware tables (see `areaFields`) the
   * create/edit form renders a per-area subset instead of this whole list.
   */
  fields: Field[];
  /**
   * Optional per-area form personalization. When set, the form watches the
   * `area` select and renders `areaFields[selectedArea]` (with area-specific
   * labels) between the always-on head (study_program_id, area) and tail
   * (position, is_active) fields. Keys must all appear in `fields`.
   */
  areaFields?: Record<string, Field[]>;
}

export const ENTITY_CONFIG: Record<EntityTable, EntityConfig> = {
  staff: {
    table: 'staff',
    title: 'Staff',
    list: ['name', 'email', 'role', 'is_active'],
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'email', label: 'Email', kind: 'email', required: true },
      { key: 'role', label: 'Role', kind: 'localized' },
      { key: 'area', label: 'Area', kind: 'localized' },
      { key: 'photo_url', label: 'Photo URL', kind: 'url' },
      { key: 'is_active', label: 'Active', kind: 'bool' },
    ],
  },
  programs: {
    table: 'programs',
    title: 'Programs',
    list: ['slug', 'kind', 'title', 'is_featured'],
    fields: [
      { key: 'slug', label: 'Slug', kind: 'text', required: true },
      { key: 'kind', label: 'Kind', kind: 'select', options: ['inbound', 'outbound'], required: true },
      { key: 'title', label: 'Title', kind: 'localized' },
      { key: 'summary', label: 'Summary', kind: 'localized' },
      { key: 'cost', label: 'Cost', kind: 'localized' },
      { key: 'duration', label: 'Duration', kind: 'text' },
      { key: 'cover_url', label: 'Cover URL', kind: 'url' },
      { key: 'is_featured', label: 'Featured', kind: 'bool' },
    ],
  },
  partners: {
    table: 'partners',
    title: 'International Partners',
    list: ['name', 'country', 'region'],
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'country', label: 'Country', kind: 'text' },
      { key: 'kind', label: 'Kind', kind: 'select', options: ['international'] },
      { key: 'region', label: 'Region', kind: 'text' },
      { key: 'lat', label: 'Latitude', kind: 'number' },
      { key: 'lng', label: 'Longitude', kind: 'number' },
      { key: 'logo_url', label: 'Logo URL', kind: 'url' },
      { key: 'url', label: 'Website', kind: 'url' },
    ],
  },
  domestic_partners: {
    table: 'domestic_partners',
    title: 'Domestic Partners',
    list: ['name', 'city', 'region'],
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'city', label: 'City', kind: 'text' },
      { key: 'region', label: 'Region', kind: 'text' },
      { key: 'logo_url', label: 'Logo URL', kind: 'url' },
      { key: 'url', label: 'Website', kind: 'url' },
    ],
  },
  news: {
    table: 'news',
    title: 'News',
    list: ['slug', 'title', 'published_at'],
    fields: [
      { key: 'slug', label: 'Slug', kind: 'text', required: true },
      { key: 'title', label: 'Title', kind: 'localized' },
      { key: 'tags', label: 'Tags (comma-separated)', kind: 'tags' },
      { key: 'published_at', label: 'Publish date', kind: 'date' },
      { key: 'cover_url', label: 'Cover URL', kind: 'url' },
    ],
  },
  testimonials: {
    table: 'testimonials',
    title: 'Testimonials',
    list: ['person_name', 'country'],
    fields: [
      { key: 'person_name', label: 'Person name', kind: 'text', required: true },
      { key: 'country', label: 'Country', kind: 'text' },
      { key: 'quote', label: 'Quote', kind: 'localized' },
      { key: 'photo_url', label: 'Photo URL', kind: 'url' },
    ],
  },
  faculties: {
    table: 'faculties',
    title: 'Faculties',
    list: ['slug', 'name', 'is_active'],
    fields: [
      { key: 'slug', label: 'Slug', kind: 'text', required: true },
      { key: 'name', label: 'Name', kind: 'localized' },
      { key: 'tagline', label: 'Tagline', kind: 'localized' },
      { key: 'description', label: 'Description', kind: 'localized' },
      { key: 'url', label: 'Faculty website', kind: 'url' },
      { key: 'logo_url', label: 'Logo URL', kind: 'url' },
      { key: 'cover_url', label: 'Cover image URL', kind: 'url' },
      { key: 'accent', label: 'Accent', kind: 'select', options: ['magenta', 'blue', 'amber', 'cyan', 'red', 'orange', 'green', 'yellow'] },
      { key: 'position', label: 'Order', kind: 'number' },
      { key: 'is_active', label: 'Active', kind: 'bool' },
    ],
  },
  study_programs: {
    table: 'study_programs',
    title: 'Study Programs',
    list: ['slug', 'name', 'degree', 'is_active'],
    fields: [
      { key: 'faculty_id', label: 'Faculty', kind: 'relation', relTable: 'faculties', required: true },
      { key: 'slug', label: 'Slug', kind: 'text', required: true },
      { key: 'name', label: 'Name', kind: 'localized' },
      { key: 'degree', label: 'Degree (e.g. Bachelor / S1)', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'localized' },
      { key: 'url', label: 'Program website', kind: 'url' },
      { key: 'position', label: 'Order', kind: 'number' },
      { key: 'is_active', label: 'Active', kind: 'bool' },
    ],
  },
  courses: {
    table: 'courses',
    title: 'Program Items',
    list: ['area', 'code', 'name', 'credits', 'semester', 'is_active'],
    // Union of every field any area can store — drives the list + record builder.
    // The form renders a tailored per-area subset from `areaFields` below.
    fields: [
      { key: 'study_program_id', label: 'Study program', kind: 'relation', relTable: 'study_programs', required: true },
      { key: 'area', label: 'Area', kind: 'select', required: true, options: PROGRAM_AREAS.map((a) => ({ value: a.value, label: a.en })) },
      { key: 'code', label: 'Code (optional)', kind: 'text' },
      { key: 'name', label: 'Name', kind: 'localized' },
      { key: 'credits', label: 'Credits (SKS)', kind: 'number' },
      { key: 'semester', label: 'Semester', kind: 'text' },
      { key: 'meta.institution', label: 'Institution', kind: 'text' },
      { key: 'meta.country', label: 'Country', kind: 'text' },
      { key: 'meta.credential', label: 'Credential', kind: 'text' },
      { key: 'meta.duration', label: 'Duration', kind: 'text' },
      { key: 'meta.detail', label: 'Detail', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'localized' },
      { key: 'position', label: 'Order', kind: 'number' },
      { key: 'is_active', label: 'Active', kind: 'bool' },
    ],
    // Personalizes the form per area so each program item type is described with
    // the right fields + labels. Head (study_program_id, area) and tail
    // (position, is_active) are always rendered around these.
    areaFields: {
      course: [
        { key: 'code', label: 'Course code (e.g. IF2110)', kind: 'text' },
        { key: 'name', label: 'Course name', kind: 'localized' },
        { key: 'credits', label: 'Credits (SKS)', kind: 'number' },
        { key: 'semester', label: 'Semester', kind: 'text' },
        { key: 'description', label: 'Description', kind: 'localized' },
      ],
      double_degree: [
        { key: 'name', label: 'Program title (e.g. Double Degree in Informatics)', kind: 'localized' },
        { key: 'meta.institution', label: 'Partner university', kind: 'text' },
        { key: 'meta.country', label: 'Country', kind: 'text' },
        { key: 'meta.credential', label: 'Degrees awarded (e.g. S.Kom + B.Sc)', kind: 'text' },
        { key: 'meta.duration', label: 'Study pattern (e.g. 2+2 years)', kind: 'text' },
        { key: 'description', label: 'Description', kind: 'localized' },
      ],
      joint_degree: [
        { key: 'name', label: 'Program title', kind: 'localized' },
        { key: 'meta.institution', label: 'Partner university', kind: 'text' },
        { key: 'meta.country', label: 'Country', kind: 'text' },
        { key: 'meta.credential', label: 'Joint degree awarded', kind: 'text' },
        { key: 'meta.duration', label: 'Duration', kind: 'text' },
        { key: 'description', label: 'Description', kind: 'localized' },
      ],
      accreditation: [
        { key: 'name', label: 'Accreditation / certification', kind: 'localized' },
        { key: 'meta.institution', label: 'Accrediting body (e.g. BAN-PT, ABET)', kind: 'text' },
        { key: 'meta.credential', label: 'Grade / level (e.g. A, Unggul)', kind: 'text' },
        { key: 'meta.detail', label: 'Valid until (e.g. 2028)', kind: 'text' },
        { key: 'description', label: 'Description', kind: 'localized' },
      ],
      study_abroad: [
        { key: 'name', label: 'Program / destination', kind: 'localized' },
        { key: 'meta.institution', label: 'Host university', kind: 'text' },
        { key: 'meta.country', label: 'Country', kind: 'text' },
        { key: 'meta.duration', label: 'Duration (e.g. 1 semester)', kind: 'text' },
        { key: 'meta.detail', label: 'Term / intake (e.g. Fall 2026)', kind: 'text' },
        { key: 'description', label: 'Description', kind: 'localized' },
      ],
      international_internship: [
        { key: 'name', label: 'Role / program title', kind: 'localized' },
        { key: 'meta.institution', label: 'Host organization', kind: 'text' },
        { key: 'meta.country', label: 'Country', kind: 'text' },
        { key: 'meta.duration', label: 'Duration (e.g. 3–6 months)', kind: 'text' },
        { key: 'description', label: 'Description', kind: 'localized' },
      ],
    },
  },
};
