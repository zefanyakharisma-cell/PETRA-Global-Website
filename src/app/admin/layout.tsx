import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { signOut } from './actions/auth';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin · PETRA International Office',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/staff', label: 'Staff' },
  { href: '/admin/programs', label: 'Programs' },
  { href: '/admin/faculties', label: 'Faculties' },
  { href: '/admin/study-programs', label: 'Study Programs' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/partners', label: 'International Partners' },
  { href: '/admin/domestic-partners', label: 'Domestic Partners' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/inquiries', label: 'Inquiries' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated (login page) renders without chrome; middleware guards the rest.
  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="w-56 shrink-0 bg-navy text-white">
        <Link href="/admin" className="block px-5 py-5">
          <Image
            src="/brand/petra-logo-white.png"
            alt="Petra Christian University"
            width={842}
            height={296}
            className="h-9 w-auto"
          />
        </Link>
        <nav className="px-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 font-condensed uppercase tracking-wide text-white/80 hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="px-3 pt-6">
          <button type="submit" className="w-full rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
            Sign out
          </button>
        </form>
        <p className="px-5 pt-6 text-xs text-white/40">{user.email}</p>
      </aside>
      <main className="flex-1 overflow-x-hidden p-8">{children}</main>
    </div>
  );
}
