import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin + the draft preview live outside the locale tree, gated by Supabase Auth.
  if (pathname.startsWith('/admin') || pathname.startsWith('/editor-preview')) {
    return updateSession(request);
  }

  return intlMiddleware(request);
}

export const config = {
  // Run on everything except Next internals, API routes, and static assets.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

// Re-export so a future combined matcher stays in one place.
export { NextResponse };
