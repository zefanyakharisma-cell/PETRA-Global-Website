import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNavigation } from '@/lib/queries';
import { clsx } from '@/lib/clsx';
import { t as localize, type Locale } from '@/lib/types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchTrigger } from './Search';
import { MobileNav } from './MobileNav';

/**
 * Topic-based, stable navigation. AUTO-BUILDS from published pages grouped by
 * nav_section — it is never audience-based (the three "doors" live on the home
 * page only). Top-level items are the fixed sections; pages slot in beneath.
 */
export async function Navbar({ locale }: { locale: string }) {
  const [groups, t] = await Promise.all([getNavigation(), getTranslations('nav')]);

  const sections = groups.map((g) => ({
    key: g.section,
    label: t(g.section),
    items: g.items.map((i) => ({
      slug: i.slug,
      label: localize(i.title, locale as Locale),
    })),
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy text-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 md:px-8" aria-label="Primary">
        <Link
          href="/"
          className="flex items-center transition-opacity duration-200 hover:opacity-80"
          aria-label="Petra Christian University — home"
        >
          <Image
            src="/brand/petra-logo-white.png"
            alt="Petra Christian University"
            width={842}
            height={296}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <ul className="ml-4 hidden items-center gap-1 md:flex">
          {sections.map((s) => (
            <li key={s.key} className="group relative">
              <Link
                href={s.items[0] ? `/${s.items[0].slug}` : '/'}
                className={clsx(
                  'relative rounded-md px-3 py-2 font-condensed text-lg uppercase tracking-wide text-white/85 transition-colors hover:text-white',
                  'after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-cyan after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 group-hover:after:scale-x-100',
                )}
              >
                {s.label}
              </Link>
              {s.items.length > 1 && (
                <ul className="invisible absolute left-0 top-full mt-1 min-w-56 translate-y-1 rounded-xl border border-ink/10 bg-white p-2 text-ink opacity-0 shadow-xl transition duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {s.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/${item.slug}`}
                        className="block rounded-md px-3 py-2 text-ink/80 transition-colors hover:bg-paper hover:text-navy"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger />
          <LanguageSwitcher />
          <MobileNav sections={sections} menuLabel={t('menu')} />
        </div>
      </nav>
    </header>
  );
}
