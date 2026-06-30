import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
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

  return (
    <Section config={block.config}>
      <Container>
        {(c.heading || c.intro) && (
          <div className="mb-8 max-w-2xl">
            {c.heading && <Reveal><h2 className="text-3xl md:text-4xl">{t(c.heading, locale)}</h2></Reveal>}
            {c.intro && (
              <Reveal delay={0.06}>
                <p className={clsx('mt-3 text-lg', onNavy ? 'text-white/80' : 'text-ink/70')}>{t(c.intro, locale)}</p>
              </Reveal>
            )}
          </div>
        )}
        <div className={clsx('grid gap-3', columns === 2 && 'md:grid-cols-2')}>
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <a
                href={it.file!.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={clsx(
                  'group flex items-center gap-4 rounded-xl border p-4 transition hover:-translate-y-0.5',
                  onNavy ? 'border-white/15 bg-white/5 hover:bg-white/10' : 'border-ink/10 bg-white hover:border-ink/20',
                )}
              >
                <span className={clsx('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide text-white', ACCENT_BG[accent] ?? 'bg-magenta')}>
                  {fileExt(it.file)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={clsx('block truncate font-condensed text-lg uppercase tracking-wide', onNavy ? 'text-white' : 'text-ink')}>
                    {t(it.title, locale) || it.file?.name || 'Download'}
                  </span>
                  {it.description && (
                    <span className={clsx('block truncate text-sm', onNavy ? 'text-white/65' : 'text-ink/60')}>{t(it.description, locale)}</span>
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
