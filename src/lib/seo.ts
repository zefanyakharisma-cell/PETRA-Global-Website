import type { Metadata } from 'next';
import { t, type Locale, type PageRecord } from '@/lib/types';

/** hreflang alternates for a path (en/id now; zh-ready). */
export function localeAlternates(locale: Locale, path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    canonical: `${base}/${locale}${path}`,
    languages: {
      en: `${base}/en${path}`,
      id: `${base}/id${path}`,
    },
  };
}

/** Build Next Metadata from a page's `seo` JSONB + hreflang alternates. */
export function pageMetadata(page: PageRecord, locale: Locale, path: string): Metadata {
  const seo = page.seo ?? {};
  const title = t(seo.title ?? null, locale) || t(page.title, locale);
  const description = t(seo.description ?? null, locale) || undefined;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/${locale}${path}`,
      languages: {
        en: `${base}/en${path}`,
        id: `${base}/id${path}`,
        // 'zh': add when the locale ships (plumbing ready).
      },
    },
    openGraph: {
      title,
      description,
      images: seo.og_image_url ? [{ url: seo.og_image_url }] : undefined,
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
