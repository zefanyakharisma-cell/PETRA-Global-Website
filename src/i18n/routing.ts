import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * v1 locales: en, id. Architected so `zh` can be added later by appending it
 * to `locales` and providing a messages file + translated content — no rebuild.
 */
export const routing = defineRouting({
  locales: ['en', 'id'],
  defaultLocale: 'en',
  // Prefix the default locale too, so /en and /id are symmetric and hreflang is clean.
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
