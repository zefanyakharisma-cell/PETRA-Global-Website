import { createClient } from '@/lib/supabase/server';
import type { PageRecord } from '@/lib/types';
import { PagesManager } from './PagesManager';

export const dynamic = 'force-dynamic';

export default async function PagesAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from('pages').select('*').order('nav_section').order('nav_order');
  const pages = (data ?? []) as PageRecord[];

  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Pages</h1>
      <p className="mt-1 text-ink/60">
        Navigation builds automatically from published pages, grouped by section. Edit a page&apos;s title,
        slug, section or order inline and press Save. Archived pages stay hidden from the public site until
        restored.
      </p>

      <PagesManager initialPages={pages} />
    </div>
  );
}
