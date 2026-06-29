'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';

interface SectionNav {
  key: string;
  label: string;
  items: { slug: string; label: string }[];
}

export function MobileNav({ sections, menuLabel }: { sections: SectionNav[]; menuLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={menuLabel}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-2 text-white"
      >
        <span className="block h-0.5 w-6 bg-current" />
        <span className="mt-1.5 block h-0.5 w-6 bg-current" />
        <span className="mt-1.5 block h-0.5 w-6 bg-current" />
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-40 max-h-[80vh] overflow-y-auto border-b border-white/10 bg-navy p-5">
          <ul className="space-y-4">
            {sections.map((s) => (
              <li key={s.key}>
                <p className="font-condensed text-sm uppercase tracking-widest text-cyan">{s.label}</p>
                <ul className="mt-1">
                  {s.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="block py-2 text-lg text-white/85"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
