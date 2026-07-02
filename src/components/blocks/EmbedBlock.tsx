import { Section, Container } from '@/components/ui/Section';
import { InlineHtml, stripHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import { resolveEmbed } from '@/lib/media';
import type { BlockComponentProps } from './registry.types';

interface EmbedContent {
  url?: string;
  caption?: LocaleMap;
}

const ASPECT: Record<string, string> = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
};

/**
 * Video / map / iframe embed. Accepts an ordinary YouTube link (watch, youtu.be,
 * shorts) or a Google Drive share link — both are rewritten to their embeddable
 * form — as well as any already-embeddable URL. Aspect ratio configurable.
 */
export function EmbedBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as EmbedContent;
  const aspect = ASPECT[(block.config.aspect as string) ?? '16/9'] ?? 'aspect-video';
  const embed = resolveEmbed(c.url);
  // contained (default) · wide (extra-wide container) · framed (matted border).
  const layout = (block.config.layout as string) ?? 'contained';
  const framed = layout === 'framed';
  const onNavy = block.config.background === 'navy';
  const captionColor = onNavy ? 'text-white/60' : 'text-ink/55';

  const player = embed ? (
    <iframe
      src={embed.src}
      title={stripHtml(t(c.caption, locale)) || 'Embedded content'}
      className="h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  ) : (
    <div className="flex h-full items-center justify-center text-ink/30">
      {locale === 'id' ? 'Tempel URL embed' : 'Paste an embed URL'}
    </div>
  );

  const media = (
    <>
      <div
        className={clsx(
          framed && clsx('rounded-2xl border p-2 md:p-3', onNavy ? 'border-white/15 bg-white/5' : 'border-ink/10 bg-white shadow-sm'),
        )}
      >
        <div className={clsx('w-full overflow-hidden bg-ink/10', framed ? 'rounded-xl' : 'rounded-2xl', aspect)}>
          {player}
        </div>
      </div>
      {t(c.caption, locale) && <InlineHtml as="p" html={t(c.caption, locale)} className={clsx('mt-3 text-center text-sm', captionColor)} />}
    </>
  );

  return (
    <Section config={block.config}>
      {layout === 'wide' ? (
        <div className="mx-auto w-full max-w-screen-2xl px-5 md:px-8">{media}</div>
      ) : (
        <Container>{media}</Container>
      )}
    </Section>
  );
}
