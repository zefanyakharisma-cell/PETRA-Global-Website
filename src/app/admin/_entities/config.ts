/** Field schema driving the generic entity admin (list + create form). */
export type EntityTable = 'staff' | 'programs' | 'partners' | 'news' | 'testimonials';

export type FieldKind =
  | 'text'
  | 'email'
  | 'number'
  | 'bool'
  | 'localized'
  | 'url'
  | 'tags'
  | 'date'
  | 'select';

export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  required?: boolean;
}

export interface EntityConfig {
  table: EntityTable;
  title: string;
  /** Columns shown in the list table (plain or localized → shown as EN). */
  list: string[];
  fields: Field[];
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
    title: 'Partners',
    list: ['name', 'country', 'kind', 'region'],
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'country', label: 'Country', kind: 'text' },
      { key: 'kind', label: 'Kind', kind: 'select', options: ['international', 'domestic'] },
      { key: 'region', label: 'Region', kind: 'text' },
      { key: 'lat', label: 'Latitude', kind: 'number' },
      { key: 'lng', label: 'Longitude', kind: 'number' },
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
};
