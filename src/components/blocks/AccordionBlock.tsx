'use client';

import { useState } from 'react';
import { Section, Container } from '@/components/ui/Section';
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
  const onNavy = block.config.background === 'navy';

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(multi ? prev : []);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <Section config={block.config}>
      <Container narrow>
        {c.heading && <h2 className="mb-6 text-3xl md:text-4xl">{t(c.heading, locale)}</h2>}
        <div className={clsx('divide-y rounded-xl border', onNavy ? 'divide-white/15 border-white/15' : 'divide-ink/10 border-ink/10 bg-white')}>
          {items.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-condensed text-xl uppercase tracking-wide">{t(item.q, locale)}</span>
                  <span className={clsx('text-2xl transition-transform', isOpen && 'rotate-45')}>+</span>
                </button>
                {isOpen && (
                  <div className={clsx('px-5 pb-5', onNavy ? 'text-white/80' : 'text-ink/70')}>
                    {t(item.a, locale)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
