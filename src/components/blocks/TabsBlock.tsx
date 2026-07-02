'use client';

import { useState } from 'react';
import { Section, Container } from '@/components/ui/Section';
import { RichText, InlineHtml } from '@/components/ui/RichText';
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

  // top = underlined tabs (default) · side = vertical tab column · pills = pill buttons.
  const layout = (block.config.layout as string) ?? 'top';
  const isSide = layout === 'side';
  const isPills = layout === 'pills';

  const tabButtonClass = (isActive: boolean) => {
    if (isPills) {
      return clsx(
        'rounded-full px-4 py-2 font-condensed text-sm uppercase tracking-wide transition-colors',
        isActive
          ? (onNavy ? 'bg-white text-navy' : 'bg-navy text-white')
          : (onNavy ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'),
      );
    }
    if (isSide) {
      return clsx(
        '-ml-px border-l-2 px-4 py-2.5 text-left font-condensed text-lg uppercase tracking-wide transition-colors duration-200',
        isActive ? ACCENT_BORDER[accent] : clsx('border-transparent', onNavy ? 'text-white/55 hover:text-white' : 'text-ink/50 hover:text-ink'),
      );
    }
    return clsx(
      '-mb-px border-b-2 px-4 py-2.5 font-condensed text-lg uppercase tracking-wide transition-colors duration-200',
      isActive
        ? ACCENT_BORDER[accent]
        : clsx('border-transparent', onNavy ? 'text-white/55 hover:border-white/30 hover:text-white' : 'text-ink/50 hover:border-ink/20 hover:text-ink'),
    );
  };

  const tablistClass = isSide
    ? clsx('flex flex-col gap-1 border-l md:w-48 md:shrink-0', onNavy ? 'border-white/15' : 'border-ink/15')
    : isPills
      ? 'flex flex-wrap gap-2'
      : clsx('flex flex-wrap gap-1 border-b', onNavy ? 'border-white/15' : 'border-ink/15');

  const tablist = (
    <div className={tablistClass} role="tablist">
      {tabs.map((tab, i) => (
        <button key={i} role="tab" aria-selected={i === active} onClick={() => setActive(i)} className={tabButtonClass(i === active)}>
          <InlineHtml as="span" html={t(tab.label, locale)} fallback={`Tab ${i + 1}`} />
        </button>
      ))}
    </div>
  );

  const panel = (
    <div className={isSide ? 'flex-1' : 'pt-6'} role="tabpanel">
      {html ? (
        <RichText html={html} onNavy={onNavy} className="max-w-reading" />
      ) : (
        <p className={clsx(onNavy ? 'text-white/50' : 'text-ink/40')}>
          {locale === 'id' ? 'Tambahkan teks di sini.' : 'Add your text here.'}
        </p>
      )}
    </div>
  );

  return (
    <Section config={block.config}>
      <Container narrow>
        {t(c.heading, locale) && <InlineHtml as="h2" html={t(c.heading, locale)} className="mb-6 text-4xl md:text-5xl" />}
        {isSide ? (
          <div className="flex flex-col gap-6 md:flex-row md:gap-10">
            {tablist}
            {panel}
          </div>
        ) : (
          <>
            {tablist}
            {panel}
          </>
        )}
      </Container>
    </Section>
  );
}
