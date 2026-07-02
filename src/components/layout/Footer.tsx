import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNavigation } from '@/lib/queries';
import { t as localize, type Locale } from '@/lib/types';
import { getLocale } from 'next-intl/server';

/** Footer carries the LIGHT values and mirrors the auto-built nav. */
export async function Footer() {
  const [groups, t, navT, locale] = await Promise.all([
    getNavigation(),
    getTranslations('footer'),
    getTranslations('nav'),
    getLocale(),
  ]);

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          {/* Brand */}
          <div className="max-w-sm">
            <Image
              src="/brand/petra-logo-white.png"
              alt="Petra Christian University"
              width={842}
              height={296}
              className="h-14 w-auto"
            />
            <p className="mt-5 text-white/70">{t('tagline')}</p>
            <div className="mt-6">
              <span className="block h-px w-10 bg-cyan" />
              <p className="mt-3 font-condensed uppercase tracking-widest text-cyan">
                {t('values')}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav
            aria-label={t('exploreLabel')}
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3"
          >
            {groups.map((g) => (
              <div key={g.section}>
                <p className="font-condensed text-sm uppercase tracking-widest text-white/40">
                  {navT(g.section)}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {g.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/${item.slug}`}
                        className="link-underline inline-block text-white/75 transition-colors hover:text-white"
                      >
                        {localize(item.title, locale as Locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col-reverse gap-3 px-5 py-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between md:px-8">
          <span>© {new Date().getFullYear()} {t('university')}. {t('rights')}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{t('office')} · {t('university')}</span>
            <span aria-hidden className="hidden text-white/25 md:inline">|</span>
            <a
              href="/admin/login"
              className="link-underline inline-block text-white/55 transition-colors hover:text-white"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
