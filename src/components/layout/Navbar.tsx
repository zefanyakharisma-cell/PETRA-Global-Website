import Image from 'next/image';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNavigation, type NavNode } from '@/lib/queries';
import { clsx } from '@/lib/clsx';
import { t as localize, type Locale } from '@/lib/types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchTrigger } from './Search';
import { MobileNav, type MobileSection } from './MobileNav';

/** Localized nav node used by the rendered menus. */
interface MenuItem {
  slug: string;
  label: string;
  children: MenuItem[];
}

function localizeNodes(nodes: NavNode[], locale: Locale): MenuItem[] {
  return nodes.map((n) => ({
    slug: n.slug,
    label: localize(n.title, locale),
    children: localizeNodes(n.children, locale),
  }));
}

/**
 * Topic-based, stable navigation. AUTO-BUILDS from published pages grouped by
 * nav_section — it is never audience-based (the three "doors" live on the home
 * page only). Each section links to its landing page; nested pages (parent_id)
 * render as layered dropdown → flyout menus.
 */
export async function Navbar({ locale }: { locale: string }) {
  const [groups, t] = await Promise.all([getNavigation(), getTranslations('nav')]);

  const sections = groups.map((g) => ({
    key: g.section,
    label: t(g.section),
    href: g.landingSlug ? `/${g.landingSlug}` : '/',
    items: localizeNodes(g.items, locale as Locale),
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
            <li key={s.key} className="group/nav relative">
              <Link
                href={s.href}
                className={clsx(
                  'relative flex items-center gap-1 rounded-md px-3 py-2 font-condensed text-lg uppercase tracking-wide text-white/85 transition-colors hover:text-white',
                  'after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-cyan after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 group-hover/nav:after:scale-x-100',
                )}
              >
                {s.label}
                {s.items.length > 0 && <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />}
              </Link>
              {s.items.length > 0 && (
                <ul className="invisible absolute left-0 top-full mt-1 min-w-60 translate-y-1 rounded-xl border border-ink/10 bg-white p-2 text-ink opacity-0 shadow-xl transition duration-200 ease-out group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
                  {s.items.map((item) => (
                    <MenuEntry key={item.slug} item={item} />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger />
          <LanguageSwitcher />
          <MobileNav sections={sections satisfies MobileSection[]} menuLabel={t('menu')} />
        </div>
      </nav>
    </header>
  );
}

/** A dropdown row. If it has children, it opens a flyout submenu to the side. */
function MenuEntry({ item }: { item: MenuItem }) {
  const linkClass =
    'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-ink/80 transition-colors hover:bg-paper hover:text-navy';

  if (item.children.length === 0) {
    return (
      <li>
        <Link href={`/${item.slug}`} className={linkClass}>
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="group/sub relative">
      <Link href={`/${item.slug}`} className={linkClass}>
        {item.label}
        <ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
      </Link>
      <ul className="invisible absolute left-full top-0 ml-1 min-w-60 -translate-x-1 rounded-xl border border-ink/10 bg-white p-2 text-ink opacity-0 shadow-xl transition duration-200 ease-out group-hover/sub:visible group-hover/sub:translate-x-0 group-hover/sub:opacity-100">
        {item.children.map((child) => (
          <li key={child.slug}>
            <Link href={`/${child.slug}`} className={linkClass}>
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
