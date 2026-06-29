import Link from 'next/link';

/** Root fallback 404 (non-localized routes, e.g. malformed /admin paths). */
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy text-white">
      <p className="font-display text-8xl text-magenta">404</p>
      <p className="mt-2 text-white/80">This page could not be found.</p>
      <Link href="/en" className="mt-6 rounded-md bg-amber px-5 py-3 font-condensed uppercase tracking-wide text-ink">
        Back to home
      </Link>
    </div>
  );
}
