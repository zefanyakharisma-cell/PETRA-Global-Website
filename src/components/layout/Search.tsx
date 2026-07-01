'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface Result {
  type: 'page' | 'program' | 'news';
  slug: string;
  title: string;
}

export function SearchTrigger() {
  const t = useTranslations('search');
  const [open, setOpen] = useState(false);

  // Cmd/Ctrl+K opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={t('label')}
        onClick={() => setOpen(true)}
        className="rounded-md border border-white/20 px-2.5 py-1 text-white/80 transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
      >
        <span aria-hidden>⌕</span>
      </button>
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        /* aborted */
      }
    }, 200);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, locale]);

  const go = (r: Result) => {
    const path = r.type === 'program' ? `/programs/${r.slug}` : r.type === 'news' ? `/news/${r.slug}` : `/${r.slug}`;
    router.push(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-navy/60 p-4 pt-24 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-ink/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-ink/40">
            ⌕
          </span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full rounded-md border border-ink/20 bg-paper/40 py-3 pl-10 pr-4 text-ink transition-colors focus:border-magenta focus:bg-white"
          />
        </div>
        <div className="mt-3">
          {results.length > 0 ? (
            <ul className="divide-y divide-ink/10">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => go(r)}
                    className="group flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-paper"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <span aria-hidden className="text-ink/25 transition-colors group-hover:text-magenta">›</span>
                      {r.title}
                    </span>
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 font-condensed text-xs uppercase tracking-wide text-ink/50 transition-colors group-hover:bg-magenta/10 group-hover:text-magenta">
                      {r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-ink/50">{searched ? t('noResults') : t('hint')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
