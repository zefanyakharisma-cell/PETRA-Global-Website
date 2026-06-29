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
        className="rounded-md border border-white/20 px-2.5 py-1 text-white/80 hover:text-white"
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-navy/70 p-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('placeholder')}
          className="w-full rounded-md border border-ink/20 px-4 py-3 text-ink focus:border-magenta"
        />
        <div className="mt-3">
          {results.length > 0 ? (
            <ul className="divide-y divide-ink/10">
              {results.map((r, i) => (
                <li key={i}>
                  <button type="button" onClick={() => go(r)} className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left hover:bg-paper">
                    <span className="text-ink">{r.title}</span>
                    <span className="font-condensed text-xs uppercase tracking-wide text-ink/40">{r.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-3 text-sm text-ink/50">{searched ? t('noResults') : t('hint')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
