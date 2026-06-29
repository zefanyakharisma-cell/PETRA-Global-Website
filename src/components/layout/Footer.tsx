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
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_2fr] md:px-8">
        <div>
          <Image
            src="/brand/petra-logo-white.png"
            alt="Petra Christian University"
            width={842}
            height={296}
            className="h-14 w-auto"
          />
          <p className="mt-4 max-w-xs text-white/80">{t('tagline')}</p>
          <p className="mt-6 font-condensed uppercase tracking-widest text-cyan">{t('values')}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((g) => (
            <div key={g.section}>
              <p className="font-condensed text-sm uppercase tracking-widest text-white/50">
                {navT(g.section)}
              </p>
              <ul className="mt-3 space-y-2">
                {g.items.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/${item.slug}`} className="text-white/80 hover:text-white">
                      {localize(item.title, locale as Locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between md:px-8">
          <span>{t('office')} · {t('university')}</span>
          <div className="flex items-center gap-4">
            <a href="/admin/login" className="text-white/60 hover:text-white">
              Admin
            </a>
            <span>© {new Date().getFullYear()} {t('university')}. {t('rights')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
