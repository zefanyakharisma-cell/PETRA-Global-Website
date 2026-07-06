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
          {sections.map((s) => {
            const hasItems = s.items.length > 0;
            return (
              <li key={s.key} className="group/nav relative">
                <Link
                  href={s.href}
                  aria-haspopup={hasItems || undefined}
                  className={clsx(
                    'relative flex items-center gap-1 rounded-md px-3 py-2 font-condensed text-lg uppercase tracking-wide text-white/85 transition-colors hover:text-white',
                    'focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-navy',
                    'after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-cyan after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 group-hover/nav:after:scale-x-100 group-focus-within/nav:after:scale-x-100',
                  )}
                >
                  {s.label}
                  {hasItems && (
                    <ChevronDown
                      className="h-4 w-4 opacity-70 transition-transform duration-200 group-hover/nav:rotate-180 group-focus-within/nav:rotate-180"
                      aria-hidden
                    />
                  )}
                </Link>
                {hasItems && (
                  // Transparent pt-2 bridge keeps hover continuous across the visual gap.
                  <div className="invisible absolute left-0 top-full translate-y-1 pt-2 opacity-0 transition duration-200 ease-out group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100">
                    <ul className="min-w-60 rounded-xl border border-ink/10 bg-white p-2 text-ink shadow-xl">
                      {s.items.map((item) => (
                        <MenuEntry key={item.slug} item={item} />
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
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
    'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-ink/80 transition-colors hover:bg-paper hover:text-navy focus-visible:bg-paper focus-visible:text-navy focus-visible:outline-none';

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
      <Link href={`/${item.slug}`} aria-haspopup className={linkClass}>
        {item.label}
        <ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
      </Link>
      {/* Transparent pl-1 bridge keeps hover continuous into the flyout. */}
      <div className="invisible absolute left-full top-0 -translate-x-1 pl-1 opacity-0 transition duration-200 ease-out group-hover/sub:visible group-hover/sub:translate-x-0 group-hover/sub:opacity-100 group-focus-within/sub:visible group-focus-within/sub:translate-x-0 group-focus-within/sub:opacity-100">
        <ul className="min-w-60 rounded-xl border border-ink/10 bg-white p-2 text-ink shadow-xl">
          {item.children.map((child) => (
            <li key={child.slug}>
              <Link href={`/${child.slug}`} className={linkClass}>
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
