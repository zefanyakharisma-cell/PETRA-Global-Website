/**
 * Hand-authored Database type for the `petra_io` schema. Mirrors
 * supabase/migrations/0001_petra_io_schema.sql. Regenerate with
 * `supabase gen types typescript` once the CLI is linked to the project.
 *
 * Row interfaces are declared standalone (no self-referential Partial inside the
 * Database map) so the supabase-js query builder resolves concrete types rather
 * than collapsing to `never`.
 */

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// NOTE: these are `type` aliases (not interfaces) on purpose — object-literal
// type aliases carry an implicit index signature and are assignable to
// Record<string, unknown>, which supabase-js's GenericTable constraint requires.
// Interfaces are NOT, and would silently collapse query results to `never`.
type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type StaffRow = Timestamps & {
  id: string;
  name: string;
  photo_url: string | null;
  role: Json;
  area: Json;
  email: string;
  is_active: boolean;
};

export type ProgramRow = Timestamps & {
  id: string;
  slug: string;
  kind: 'inbound' | 'outbound';
  title: Json;
  summary: Json;
  cost: Json;
  duration: string | null;
  owner_staff_id: string | null;
  is_featured: boolean;
  cover_url: string | null;
};

export type PartnerRow = Timestamps & {
  id: string;
  name: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  kind: 'international' | 'domestic';
  region: string | null;
  logo_url: string | null;
  url: string | null;
};

export type NewsRow = Timestamps & {
  id: string;
  slug: string;
  title: Json;
  body: Json;
  tags: string[];
  published_at: string | null;
  cover_url: string | null;
};

export type TestimonialRow = Timestamps & {
  id: string;
  quote: Json;
  person_name: string;
  country: string | null;
  program_id: string | null;
  photo_url: string | null;
};

export type InquiryRow = {
  id: string;
  kind: 'student' | 'partner' | 'outbound';
  payload: Json;
  program_id: string | null;
  recipient_staff_id: string | null;
  status: 'new' | 'in_progress' | 'closed';
  created_at: string;
};

export type PageRow = Timestamps & {
  id: string;
  slug: string;
  title: Json;
  nav_section: 'about' | 'mobility' | 'partnership' | 'life' | 'news' | 'none';
  nav_order: number;
  parent_id: string | null;
  status: 'draft' | 'published';
  owner_staff_id: string | null;
  seo: Json;
};

export type BlockRow = Timestamps & {
  id: string;
  page_id: string;
  type: string;
  position: number;
  config: Json;
  content: Json;
};

type TableShape<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  petra_io: {
    Tables: {
      staff: TableShape<StaffRow, 'name' | 'email'>;
      programs: TableShape<ProgramRow, 'slug' | 'kind'>;
      partners: TableShape<PartnerRow, 'name'>;
      news: TableShape<NewsRow, 'slug'>;
      testimonials: TableShape<TestimonialRow, 'person_name'>;
      inquiries: TableShape<InquiryRow, 'kind' | 'payload'>;
      pages: TableShape<PageRow, 'slug'>;
      blocks: TableShape<BlockRow, 'page_id' | 'type' | 'position'>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      nav_section: 'about' | 'mobility' | 'partnership' | 'life' | 'news' | 'none';
      page_status: 'draft' | 'published';
      program_kind: 'inbound' | 'outbound';
      partner_kind: 'international' | 'domestic';
      inquiry_kind: 'student' | 'partner' | 'outbound';
      inquiry_status: 'new' | 'in_progress' | 'closed';
    };
    CompositeTypes: Record<string, never>;
  };
}
