'use client';

import { useState } from 'react';
import { Section, Container } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface Tab {
  label?: LocaleMap;
  body?: LocaleMap; // Tiptap HTML per locale
}

interface TabsContent {
  heading?: LocaleMap;
  tabs?: Tab[];
}

const ACCENT_BORDER: Record<string, string> = {
  magenta: 'border-magenta text-magenta',
  amber: 'border-amber text-amber',
  cyan: 'border-cyan text-cyan',
  blue: 'border-blue text-blue',
  red: 'border-red text-red',
  orange: 'border-orange text-orange',
  green: 'border-green text-green',
  yellow: 'border-yellow text-yellow',
};

/** Tabbed content panels — group related copy without a long scroll. */
export function TabsBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as TabsContent;
  const tabs = c.tabs ?? [];
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = block.config.background === 'navy';
  const [active, setActive] = useState(0);

  if (tabs.length === 0) {
    return (
      <Section config={block.config}>
        <Container narrow>
          <p className="text-ink/40">{locale === 'id' ? 'Tambahkan tab.' : 'Add tabs.'}</p>
        </Container>
      </Section>
    );
  }

  const current = tabs[Math.min(active, tabs.length - 1)];
  const html = t(current.body, locale);

  return (
    <Section config={block.config}>
      <Container narrow>
        {c.heading && <h2 className="mb-6 text-4xl md:text-5xl">{t(c.heading, locale)}</h2>}
        <div
          className={clsx('flex flex-wrap gap-1 border-b', onNavy ? 'border-white/15' : 'border-ink/15')}
          role="tablist"
        >
          {tabs.map((tab, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className={clsx(
                  '-mb-px border-b-2 px-4 py-2.5 font-condensed text-lg uppercase tracking-wide transition',
                  isActive
                    ? ACCENT_BORDER[accent]
                    : clsx('border-transparent', onNavy ? 'text-white/55 hover:text-white' : 'text-ink/50 hover:text-ink'),
                )}
              >
                {t(tab.label, locale) || `Tab ${i + 1}`}
              </button>
            );
          })}
        </div>
        <div className="pt-6" role="tabpanel">
          {html ? (
            <div
              className={clsx('prose-block max-w-reading', onNavy && 'prose-on-navy')}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className={clsx(onNavy ? 'text-white/50' : 'text-ink/40')}>
              {locale === 'id' ? 'Tambahkan teks di sini.' : 'Add your text here.'}
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}
