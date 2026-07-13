import { Section, Container, isDarkBg } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineHtml, RichText } from '@/components/ui/RichText';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { aggregate, type ChartData, type ChartQuery } from '@/lib/chartSources';
import { ChartEmbed } from './chart/ChartEmbed';
import type { ChartType } from './chart/ChartCanvas';

/** Plot height presets (config.height) → pixels. */
const HEIGHTS: Record<string, number> = { sm: 260, md: 360, lg: 480 };

interface ChartBlockContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
  data?: ChartData;
}

/** Coerce a stored dataset to a safe {headers, rows}. */
function normalise(data: ChartData | undefined): ChartData {
  if (!data || !Array.isArray(data.headers) || !Array.isArray(data.rows)) return { headers: [], rows: [] };
  return { headers: data.headers, rows: data.rows.filter((r) => Array.isArray(r) && r.length > 0) };
}

/**
 * Data-visualisation block. Editors supply data three ways — a manual grid, an
 * uploaded Excel/CSV (both stored in content.data), or an aggregated query over
 * an allowlisted table (config.dbQuery). This server component resolves the
 * dataset (running the DB aggregation when needed) and hands it to the client
 * Recharts canvas.
 */
export async function ChartBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as ChartBlockContent;
  const cfg = block.config;

  const source = (cfg.source as string) ?? 'manual';
  const type = ((cfg.chartType as string) ?? 'bar') as ChartType;
  const onDark = isDarkBg(cfg.background);

  let data: ChartData;
  if (source === 'database') {
    const supabase = await createClient();
    data = await aggregate(supabase as never, cfg.dbQuery as ChartQuery | undefined);
  } else {
    data = normalise(c.data);
  }

  const hasData = data.rows.length > 0 && data.headers.length >= 2;
  const heading = t(c.heading, locale);
  const intro = t(c.intro, locale);

  return (
    <Section config={cfg}>
      <Container>
        {heading && (
          <InlineHtml as="h2" html={heading} className="text-3xl md:text-4xl" />
        )}
        {intro && (
          <RichText html={intro} className={clsx('mt-3 max-w-2xl', onDark ? 'text-white/75' : 'text-ink/70')} />
        )}
        <div className={clsx(heading || intro ? 'mt-8' : '')}>
          {hasData ? (
            <ChartEmbed
              type={type}
              headers={data.headers}
              rows={data.rows}
              onDark={onDark}
              showLegend={cfg.showLegend !== false}
              showGrid={cfg.showGrid !== false}
              height={HEIGHTS[(cfg.height as string) ?? 'md'] ?? HEIGHTS.md}
            />
          ) : (
            <EmptyState
              onDark={onDark}
              title={locale === 'id' ? 'Belum ada data' : 'No data yet'}
              hint={
                source === 'database'
                  ? locale === 'id' ? 'Pilih tabel dan kolom pada opsi blok.' : 'Choose a table and column in the block options.'
                  : locale === 'id' ? 'Tambahkan data pada grid atau unggah file Excel/CSV.' : 'Add rows in the grid or upload an Excel/CSV file.'
              }
            />
          )}
        </div>
      </Container>
    </Section>
  );
}
