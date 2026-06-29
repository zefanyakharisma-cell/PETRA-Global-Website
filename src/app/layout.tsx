import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Petra Christian University — International Office',
    template: '%s · PETRA International Office',
  },
  description:
    'The International Office of Petra Christian University (PETRA), Surabaya — a caring and global university.',
};

/**
 * Root layout. Holds the single <html>/<body>. Locale is read from next-intl
 * (set by middleware) so the lang attribute is correct on every route, including
 * the non-localized /admin tree.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
