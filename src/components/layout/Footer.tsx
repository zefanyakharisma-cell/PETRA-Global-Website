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
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
          {/* Brand */}
          <div className="max-w-xs">
            <Image
              src="/brand/petra-logo-white.png"
              alt="Petra Christian University"
              width={842}
              height={296}
              className="h-10 w-auto"
            />
            <p className="mt-4 text-sm leading-relaxed text-white/60">{t('tagline')}</p>
            <p className="mt-3 font-condensed text-xs uppercase tracking-widest text-cyan">
              {t('values')}
            </p>
          </div>

          {/* Navigation */}
          <nav
            aria-label={t('exploreLabel')}
            className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3"
          >
            {groups.map((g) => (
              <div key={g.section}>
                <p className="font-condensed text-xs uppercase tracking-widest text-white/40">
                  {navT(g.section)}
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {g.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/${item.slug}`}
                        className="link-underline inline-block text-sm text-white/70 transition-colors hover:text-white"
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
        <div className="mx-auto flex max-w-6xl flex-col-reverse gap-2 px-5 py-4 text-xs text-white/50 md:flex-row md:items-center md:justify-between md:px-8">
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
