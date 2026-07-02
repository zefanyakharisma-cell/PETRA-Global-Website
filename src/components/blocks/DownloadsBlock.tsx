import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface FileValue {
  url?: string;
  name?: string;
  size?: number;
}

interface DownloadItem {
  title?: LocaleMap;
  description?: LocaleMap;
  file?: FileValue;
}

interface DownloadsContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
  items?: DownloadItem[];
}

const ACCENT_BG: Record<string, string> = {
  magenta: 'bg-magenta', amber: 'bg-amber', cyan: 'bg-cyan', blue: 'bg-blue',
  red: 'bg-red', orange: 'bg-orange', green: 'bg-green', yellow: 'bg-yellow',
};

/** Human file size, e.g. 2.3 MB. */
function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u++; }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

/** Extension badge from a filename or URL (PDF, DOCX, …). */
function fileExt(f?: FileValue): string {
  const src = f?.name || f?.url || '';
  const m = src.split('?')[0].match(/\.([a-z0-9]{1,5})$/i);
  return m ? m[1].toUpperCase() : 'FILE';
}

/** A list of downloadable documents — brochures, fact sheets, fee schedules, MoUs. */
export function DownloadsBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as DownloadsContent;
  const items = (c.items ?? []).filter((it) => it.file?.url);
  const columns = Math.min(Math.max(Number(block.config.columns) || 1, 1), 2);
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = block.config.background === 'navy';
  // list = rows (default) · cards = tiles grid · compact = dense divided panel.
  const layout = (block.config.layout as string) ?? 'list';
  const isCards = layout === 'cards';
  const isCompact = layout === 'compact';

  const header = (c.heading || c.intro) && (
    <div className="mb-8 max-w-2xl">
      {t(c.heading, locale) && <Reveal><InlineHtml as="h2" html={t(c.heading, locale)} className="text-3xl md:text-4xl" /></Reveal>}
      {t(c.intro, locale) && (
        <Reveal delay={0.06}>
          <RichText html={t(c.intro, locale)} onNavy={onNavy} className={clsx('mt-3 text-lg', !onNavy && 'text-ink/70')} />
        </Reveal>
      )}
    </div>
  );

  // Cards: a vertical tile per file (badge on top, then title / description).
  if (isCards) {
    return (
      <Section config={block.config}>
        <Container>
          {header}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <a
                  href={it.file!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={it.file!.name || true}
                  className={clsx(
                    'group flex h-full flex-col gap-3 rounded-2xl border p-6 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift',
                    onNavy ? 'border-white/15 bg-white/5 hover:bg-white/10' : 'border-ink/10 bg-white hover:border-ink/20',
                  )}
                >
                  <span className={clsx('inline-flex h-12 w-12 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide text-white transition-transform duration-300 ease-out group-hover:scale-105', ACCENT_BG[accent] ?? 'bg-magenta')}>
                    {fileExt(it.file)}
                  </span>
                  <InlineHtml as="span" html={t(it.title, locale)} fallback={it.file?.name || 'Download'} className={clsx('block font-condensed text-lg uppercase tracking-wide', onNavy ? 'text-white' : 'text-ink')} />
                  {t(it.description, locale) && (
                    <InlineHtml as="span" html={t(it.description, locale)} className={clsx('block text-sm', onNavy ? 'text-white/65' : 'text-ink/60')} />
                  )}
                  <span className={clsx('mt-auto pt-2 text-xs', onNavy ? 'text-white/50' : 'text-ink/40')}>
                    {formatSize(it.file?.size)}
                    <span className="ml-2 inline-block transition group-hover:translate-y-0.5">↓</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section config={block.config}>
      <Container>
        {header}
        <div
          className={clsx(
            isCompact
              ? clsx('divide-y overflow-hidden rounded-xl border', onNavy ? 'divide-white/10 border-white/15' : 'divide-ink/10 border-ink/10 bg-white')
              : clsx('grid gap-3', columns === 2 && 'md:grid-cols-2'),
          )}
        >
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <a
                href={it.file!.url}
                target="_blank"
                rel="noopener noreferrer"
                download={it.file!.name || true}
                className={clsx(
                  'group flex items-center gap-4 transition duration-300 ease-out',
                  isCompact
                    ? clsx('px-4 py-3', onNavy ? 'hover:bg-white/5' : 'hover:bg-paper/60')
                    : clsx('rounded-xl border p-4 hover:-translate-y-0.5 hover:shadow-lift', onNavy ? 'border-white/15 bg-white/5 hover:bg-white/10' : 'border-ink/10 bg-white hover:border-ink/20'),
                )}
              >
                <span className={clsx('inline-flex shrink-0 items-center justify-center rounded-lg font-bold tracking-wide text-white transition-transform duration-300 ease-out group-hover:scale-105', isCompact ? 'h-9 w-9 text-[10px]' : 'h-12 w-12 text-[11px]', ACCENT_BG[accent] ?? 'bg-magenta')}>
                  {fileExt(it.file)}
                </span>
                <span className="min-w-0 flex-1">
                  <InlineHtml as="span" html={t(it.title, locale)} fallback={it.file?.name || 'Download'} className={clsx('block truncate font-condensed uppercase tracking-wide', isCompact ? 'text-base' : 'text-lg', onNavy ? 'text-white' : 'text-ink')} />
                  {!isCompact && t(it.description, locale) && (
                    <InlineHtml as="span" html={t(it.description, locale)} className={clsx('block truncate text-sm', onNavy ? 'text-white/65' : 'text-ink/60')} />
                  )}
                </span>
                <span className={clsx('shrink-0 text-xs', onNavy ? 'text-white/50' : 'text-ink/40')}>
                  {formatSize(it.file?.size)}
                  <span className="ml-2 inline-block transition group-hover:translate-y-0.5">↓</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
