import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as never)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations('nav');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Petra Christian University',
    alternateName: 'Universitas Kristen Petra',
    foundingDate: '1961',
    slogan: 'A caring and global university.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Surabaya',
      addressCountry: 'ID',
    },
    department: { '@type': 'Organization', name: 'International Office' },
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        {t('skipToContent')}
      </a>
      <Navbar locale={locale} />
      <main id="main">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
