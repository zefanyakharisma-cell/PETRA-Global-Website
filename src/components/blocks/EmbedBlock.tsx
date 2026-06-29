import { Section, Container } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
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

/** Video / map / iframe embed. Aspect ratio configurable. */
export function EmbedBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as EmbedContent;
  const aspect = ASPECT[(block.config.aspect as string) ?? '16/9'] ?? 'aspect-video';

  return (
    <Section config={block.config}>
      <Container>
        <div className={clsx('w-full overflow-hidden rounded-2xl bg-ink/10', aspect)}>
          {c.url ? (
            <iframe
              src={c.url}
              title={t(c.caption, locale) || 'Embedded content'}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink/30">
              {locale === 'id' ? 'Tempel URL embed' : 'Paste an embed URL'}
            </div>
          )}
        </div>
        {c.caption && <p className="mt-3 text-center text-sm text-ink/55">{t(c.caption, locale)}</p>}
      </Container>
    </Section>
  );
}
