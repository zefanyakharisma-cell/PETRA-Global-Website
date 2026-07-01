import { createClient } from '@/lib/supabase/server';
import type { NewsRecord } from '@/lib/types';
import { NewsManager } from './NewsManager';

export const dynamic = 'force-dynamic';

export default async function NewsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false, nullsFirst: true });
  const news = (data ?? []) as NewsRecord[];

  return (
    <div>
      <h1 className="font-display text-4xl text-navy">News</h1>
      <p className="mt-1 text-ink/60">
        Each article gets its own slug page at <span className="font-medium">/news/&lt;slug&gt;</span>. Create an
        article below, then press <span className="font-medium">Blocks</span> to build its body with the same block
        editor used for Pages. Articles stay drafts (hidden from the public site) until published.
      </p>

      <NewsManager initialNews={news} />
    </div>
  );
}
