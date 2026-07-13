'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { InlineHtml, stripHtml } from '@/components/ui/RichText';
import { cardSurface } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';

export interface CardGridCardData {
  title: string;
  body: string;
  image_url?: string;
  href?: string;
  /** Optional extra call-to-action shown in the popup (download / page link). */
  linkLabel?: string;
  linkHref?: string;
  /** Optional contact details shown in the popup. */
  contactEmail?: string;
  contactPhone?: string;
}

export interface CardGridOptions {
  /** Whole card (or button) links to its page. */
  linkToPage: boolean;
  /** Clicking opens a compact popup with the card's details. */
  enablePopup: boolean;
  /** Render an explicit button instead of making the whole card clickable. */
  showButton: boolean;
}

/**
 * Interactive card for the card grid. The admin can enable any combination of
 * three behaviours (link, popup, button); this resolves them into a single
 * sensible interaction:
 *  - popup takes priority as the click action; the page link, if also enabled,
 *    appears as a "Visit page" link inside the popup;
 *  - otherwise the card links to its page;
 *  - "show button" moves the trigger onto an explicit button so the card body
 *    itself is not clickable (avoids nested interactive elements).
 */
export function CardGridCard({
  card,
  onNavy,
  options,
  buttonLabel,
  viewLabel,
  variant = 'vertical',
  cardStyle,
}: {
  card: CardGridCardData;
  onNavy: boolean;
  options: CardGridOptions;
  buttonLabel: string;
  viewLabel: string;
  /** vertical = image on top (grid) · horizontal = image beside copy (list / featured). */
  variant?: 'vertical' | 'horizontal';
  /** Card surface skin from the block's cardStyle option. */
  cardStyle?: string;
}) {
  const [open, setOpen] = useState(false);
  const horizontal = variant === 'horizontal';

  const isExternal = !!card.href && card.href.startsWith('http');
  const canLink = options.linkToPage && !!card.href;
  // The primary action when the card/button is activated.
  const action: 'popup' | 'link' | 'none' = options.enablePopup ? 'popup' : canLink ? 'link' : 'none';

  const hasFaceLink = !!card.linkHref;
  // A per-card link/download button lives on the card face. Because it is itself
  // interactive, its presence forces explicit buttons (the card body can no
  // longer be the trigger — nesting interactive elements is invalid).
  const useExplicitButtons = options.showButton || hasFaceLink;

  // Primary action button in the footer. Shown when the admin asked for an
  // explicit button, or when a face link forces buttons and there is an action.
  const primaryButton =
    options.showButton || (hasFaceLink && action !== 'none') ? (
      action === 'link' && card.href ? (
        <CardLink href={card.href} external={isExternal} className={buttonClass(onNavy)}>
          <InlineHtml as="span" html={buttonLabel} />
        </CardLink>
      ) : (
        <button
          type="button"
          onClick={() => action === 'popup' && setOpen(true)}
          disabled={action === 'none'}
          className={clsx(buttonClass(onNavy), action === 'none' && 'cursor-default opacity-60')}
        >
          <InlineHtml as="span" html={buttonLabel} />
        </button>
      )
    ) : null;

  // The download / page-link button, styled as an outlined secondary action.
  const faceLinkButton = card.linkHref ? (
    <CardLink href={card.linkHref} external={card.linkHref.startsWith('http')} className={outlineButtonClass(onNavy)}>
      <InlineHtml as="span" html={card.linkLabel || 'Open'} />
    </CardLink>
  ) : null;

  const footer =
    primaryButton || faceLinkButton ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {primaryButton}
        {faceLinkButton}
      </div>
    ) : null;

  const shell = (
    <div
      className={clsx(
        'group relative flex h-full overflow-hidden rounded-[var(--card-r,1rem)] transition duration-300 ease-out hover:-translate-y-1.5',
        horizontal ? 'flex-col sm:flex-row' : 'flex-col',
        cardSurface(cardStyle, onNavy),
      )}
    >
      {/* Brand accent wipes in along the bottom edge on hover. */}
      <div
        className={clsx(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100',
          onNavy ? 'bg-cyan' : 'bg-magenta',
        )}
      />
      <div
        className={clsx(
          'media-zoom relative overflow-hidden bg-ink/5',
          horizontal ? 'aspect-[16/10] sm:aspect-auto sm:w-56 sm:shrink-0 sm:self-stretch' : 'aspect-[16/10]',
        )}
      >
        {card.image_url && <Image src={card.image_url} alt={stripHtml(card.title)} fill className="object-cover" />}
        {/* Quiet gradient that lifts on hover for depth over the image. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className={clsx('flex flex-1 flex-col p-5', horizontal && 'justify-center')}>
        <InlineHtml as="h3" html={card.title} className={clsx('text-2xl transition-colors', onNavy ? 'text-white' : 'text-ink group-hover:text-navy')} />
        {card.body && <div className={clsx('rich-inline mt-2 text-sm', horizontal ? 'line-clamp-2' : 'line-clamp-3', onNavy ? 'text-white/70' : 'text-ink/65')} dangerouslySetInnerHTML={{ __html: card.body }} />}
        {footer}
      </div>
    </div>
  );

  // With an explicit button, the card body itself is never the trigger.
  let cardNode: React.ReactNode = shell;
  if (!useExplicitButtons) {
    if (action === 'popup') {
      cardNode = (
        <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
          {shell}
        </button>
      );
    } else if (action === 'link' && card.href) {
      cardNode = (
        <CardLink href={card.href} external={isExternal} className="block">
          {shell}
        </CardLink>
      );
    }
  }

  return (
    <>
      {cardNode}
      {open && (
        <CardPopup
          card={card}
          showVisit={canLink}
          viewLabel={viewLabel}
          external={isExternal}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CardLink({
  href,
  external,
  className,
  children,
}: {
  href: string;
  external: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function buttonClass(onNavy: boolean) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2',
    'font-condensed text-sm uppercase tracking-wide transition',
    onNavy ? 'bg-white text-navy hover:brightness-95' : 'bg-navy text-white hover:bg-navy-2',
  );
}

/** Outlined secondary button — pairs with the solid primary in a card footer. */
function outlineButtonClass(onNavy: boolean) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2',
    'font-condensed text-sm uppercase tracking-wide transition',
    onNavy ? 'border-white/40 text-white hover:bg-white/10' : 'border-navy/30 text-navy hover:bg-navy/5',
  );
}

/** Compact details popup for a single card. */
function CardPopup({
  card,
  showVisit,
  viewLabel,
  external,
  onClose,
}: {
  card: CardGridCardData;
  showVisit: boolean;
  viewLabel: string;
  external: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={stripHtml(card.title)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-xl text-ink/70 hover:bg-white"
        >
          ×
        </button>
        {card.image_url && (
          <div className="relative aspect-[16/9] bg-ink/5">
            <Image src={card.image_url} alt={stripHtml(card.title)} fill className="object-cover" />
          </div>
        )}
        <div className="p-5">
          <InlineHtml as="h3" html={card.title} className="text-2xl" />
          {card.body && <div className="rich-inline mt-2 text-sm text-ink/70" dangerouslySetInnerHTML={{ __html: card.body }} />}

          {(card.contactEmail || card.contactPhone) && (
            <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-sm text-ink/70">
              {card.contactEmail && (
                <a href={`mailto:${card.contactEmail}`} className="flex items-center gap-2 hover:text-magenta">
                  <span aria-hidden className="text-ink/40">✉</span>
                  <span className="truncate">{card.contactEmail}</span>
                </a>
              )}
              {card.contactPhone && (
                <a href={`tel:${card.contactPhone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-2 hover:text-magenta">
                  <span aria-hidden className="text-ink/40">☎</span>
                  <span>{card.contactPhone}</span>
                </a>
              )}
            </div>
          )}

          {(card.linkHref || (showVisit && card.href)) && (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              {card.linkHref && (
                <CardLink
                  href={card.linkHref}
                  external={card.linkHref.startsWith('http')}
                  className={buttonClass(false)}
                >
                  <InlineHtml as="span" html={card.linkLabel || 'Open'} />
                </CardLink>
              )}
              {showVisit && card.href && (
                <CardLink
                  href={card.href}
                  external={external}
                  className="inline-flex items-center gap-1 font-condensed text-sm uppercase tracking-wide text-magenta hover:underline"
                >
                  {viewLabel} →
                </CardLink>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
