'use client';

import { useState } from 'react';
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
