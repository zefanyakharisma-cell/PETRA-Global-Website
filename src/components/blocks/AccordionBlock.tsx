'use client';

import { useState } from 'react';
import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface QA {
  q?: LocaleMap;
  a?: LocaleMap;
}

interface AccordionContent {
  heading?: LocaleMap;
  items?: QA[];
}

/** FAQ / Q&A. Single- or multi-open per config. Keyboard accessible. */
export function AccordionBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as AccordionContent;
  const multi = (block.config.openMode as string) !== 'single';
  const items = c.items ?? [];
  const [open, setOpen] = useState<Set<number>>(new Set());
  const onNavy = isDarkBg(block.config.background);
  // bordered = single panel (default) · plain = dividers only · cards = each
  // Q&A in its own separated card.
  const layout = (block.config.layout as string) ?? 'bordered';
  const asCards = layout === 'cards';
  const listClass = asCards
    ? 'space-y-3'
    : layout === 'plain'
      ? clsx('divide-y', onNavy ? 'divide-white/15' : 'divide-ink/10')
      : clsx('divide-y rounded-xl border', onNavy ? 'divide-white/15 border-white/15' : 'divide-ink/10 border-ink/10 bg-white');
  const itemClass = asCards
    ? clsx('overflow-hidden rounded-xl border', onNavy ? 'border-white/15 bg-white/5' : 'border-ink/10 bg-white shadow-sm')
    : '';

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(multi ? prev : []);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <Section config={block.config}>
      <Container narrow>
        {t(c.heading, locale) && <InlineHtml as="h2" html={t(c.heading, locale)} className="mb-6 text-3xl md:text-4xl" />}
        <div className={listClass}>
          {items.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <div key={i} className={itemClass}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className={clsx(
                    'group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors',
                    onNavy ? 'hover:bg-white/5' : 'hover:bg-paper/60',
                  )}
                >
                  <InlineHtml as="span" html={t(item.q, locale)} className={clsx('font-condensed text-xl uppercase tracking-wide transition-colors', !onNavy && 'group-hover:text-navy')} />
                  <span
                    className={clsx(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xl leading-none transition-all duration-300 ease-out',
                      onNavy ? 'bg-white/10 group-hover:bg-white/20' : 'bg-ink/5 group-hover:bg-magenta/10',
                      isOpen ? 'rotate-45 text-magenta' : 'text-ink/60',
                      onNavy && 'text-white/80',
                    )}
                  >
                    +
                  </span>
                </button>
                <div
                  className={clsx(
                    'grid transition-all duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <RichText html={t(item.a, locale)} onNavy={onNavy} className={clsx('px-5 pb-5', !onNavy && 'text-ink/70')} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
