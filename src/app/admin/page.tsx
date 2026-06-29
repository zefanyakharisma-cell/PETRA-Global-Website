import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

async function count(table: 'pages' | 'programs' | 'partners' | 'news' | 'staff' | 'inquiries') {
  const supabase = await createClient();
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export default async function AdminDashboard() {
  const [pages, programs, partners, news, staff, inquiries] = await Promise.all([
    count('pages'), count('programs'), count('partners'), count('news'), count('staff'), count('inquiries'),
  ]);

  const cards = [
    { label: 'Pages', value: pages, href: '/admin/pages' },
    { label: 'Programs', value: programs, href: '/admin/programs' },
    { label: 'Partners', value: partners, href: '/admin/partners' },
    { label: 'News', value: news, href: '/admin/news' },
    { label: 'Staff', value: staff, href: '/admin/staff' },
    { label: 'Inquiries', value: inquiries, href: '/admin/inquiries' },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Dashboard</h1>
      <p className="mt-1 text-ink/60">Manage content, pages, and inquiries for the International Office site.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl bg-white p-6 ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="font-display text-5xl text-magenta">{c.value}</p>
            <p className="mt-1 font-condensed uppercase tracking-wide text-ink/60">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
