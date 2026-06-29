'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

/** en/id switcher. Preserves the current path; ready to add `zh` later. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center rounded-md border border-white/20 text-sm">
      {routing.locales.map((l, i) => (
        <button
          key={l}
          type="button"
          aria-current={l === locale}
          onClick={() => router.replace(pathname, { locale: l })}
          className={
            'px-2.5 py-1 font-condensed uppercase tracking-wide ' +
            (l === locale ? 'bg-white text-navy' : 'text-white/80') +
            (i === 0 ? ' rounded-l-md' : ' rounded-r-md')
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}
