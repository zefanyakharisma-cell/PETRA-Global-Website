import { Section, Container } from '@/components/ui/Section';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface RichTextContent {
  /** HTML produced by the Tiptap editor, per locale. */
  html?: LocaleMap;
}

/** The flexible escape hatch: Tiptap WYSIWYG output in a styled reading column. */
export function RichTextBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as RichTextContent;
  const narrow = (block.config.width as string) !== 'full';
  const onNavy = block.config.background === 'navy';
  const html = t(c.html, locale);

  return (
    <Section config={block.config}>
      <Container narrow={narrow}>
        {html ? (
          <div
            className={clsx(
              'prose-block max-w-reading',
              onNavy && 'prose-on-navy',
            )}
            // Tiptap output is sanitized on save in the editor; trusted admin content.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-ink/40">
            {locale === 'id' ? 'Tambahkan teks di sini.' : 'Add your text here.'}
          </p>
        )}
      </Container>
    </Section>
  );
}
