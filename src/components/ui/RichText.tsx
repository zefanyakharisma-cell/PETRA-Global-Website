import { clsx } from '@/lib/clsx';
import type { ElementType } from 'react';

/** Strip tags/entities from rich HTML for plain-text contexts (alt, title…). */
export function stripHtml(s?: string): string {
  if (!s) return '';
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Renders block rich-text HTML (from the WYSIWYG `richtext` fields) in a styled
 * reading column. Content is trusted admin output — TipTap emits only known
 * nodes/marks — so `dangerouslySetInnerHTML` is safe here.
 */
export function RichText({
  html,
  className,
  onNavy = false,
}: {
  html?: string;
  className?: string;
  onNavy?: boolean;
}) {
  if (!html) return null;
  return (
    <div
      className={clsx('prose-block', onNavy && 'prose-on-navy', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders inline rich-text HTML (from `richtext-inline` fields) straight into a
 * chosen semantic tag — the HTML carries no block wrapper, so `<InlineHtml as="h2">`
 * keeps the heading semantics while honouring bold/colour/etc. Falls back to a
 * plain string when empty so blocks still show placeholder copy.
 */
export function InlineHtml({
  as,
  html,
  className,
  fallback,
}: {
  as?: ElementType;
  html?: string;
  className?: string;
  fallback?: string;
}) {
  const Tag = as ?? 'span';
  if (html && html.trim()) {
    return <Tag className={clsx('rich-inline', className)} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  if (fallback) return <Tag className={className}>{fallback}</Tag>;
  return null;
}
