'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/routing';

export interface MobileMenuItem {
  slug: string;
  label: string;
  children: MobileMenuItem[];
}

export interface MobileSection {
  key: string;
  label: string;
  href: string;
  items: MobileMenuItem[];
}

export function MobileNav({ sections, menuLabel }: { sections: MobileSection[]; menuLabel: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Close on Escape and lock body scroll while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={menuLabel}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
      >
        <span className="sr-only">{menuLabel}</span>
        <span aria-hidden className="relative block h-4 w-6">
          <span
            className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${
              open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 block h-0.5 w-6 -translate-y-1/2 bg-current transition-opacity duration-200 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${
              open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0'
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={close}
            className="fixed inset-0 top-16 z-40 cursor-default bg-ink/40"
          />
          <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-white/10 bg-navy p-5">
            <ul className="space-y-4">
              {sections.map((s) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    onClick={close}
                    className="block font-condensed text-sm uppercase tracking-widest text-cyan"
                  >
                    {s.label}
                  </Link>
                  {s.items.length > 0 && (
                    <ul className="mt-1">
                      {s.items.map((item) => (
                        <MobileEntry key={item.slug} item={item} depth={0} onNavigate={close} />
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/** A collapsible mobile menu row. Rows with children toggle open; leaves link. */
function MobileEntry({
  item,
  depth,
  onNavigate,
}: {
  item: MobileMenuItem;
  depth: number;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pad = { paddingLeft: `${depth * 0.75}rem` };

  if (item.children.length === 0) {
    return (
      <li>
        <Link
          href={`/${item.slug}`}
          onClick={onNavigate}
          style={pad}
          className="block py-2 text-white/85"
        >
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div className="flex items-center" style={pad}>
        <Link href={`/${item.slug}`} onClick={onNavigate} className="flex-1 py-2 text-white/85">
          {item.label}
        </Link>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
          onClick={() => setExpanded((v) => !v)}
          className="p-2 text-white/60"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <ul>
          {item.children.map((child) => (
            <MobileEntry key={child.slug} item={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}
