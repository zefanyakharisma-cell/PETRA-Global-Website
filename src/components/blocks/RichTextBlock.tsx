import { Section, Container } from '@/components/ui/Section';
import { RichText } from '@/components/ui/RichText';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface RichTextContent {
  /** HTML produced by the Tiptap editor, per locale. */
  html?: LocaleMap;
}

/** The flexible escape hatch: Tiptap WYSIWYG output in a styled reading column. */
export function RichTextBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as RichTextContent;
  // narrow = centred reading column · full = full width · two-column = flows
  // into two balanced newspaper columns on wide screens.
  const width = (block.config.width as string) ?? 'narrow';
  const narrow = width === 'narrow';
  const twoColumn = width === 'two-column';
  const onNavy = block.config.background === 'navy';
  const html = t(c.html, locale);

  return (
    <Section config={block.config}>
      <Container narrow={narrow}>
        {html ? (
          <RichText
            html={html}
            onNavy={onNavy}
            className={twoColumn ? 'md:columns-2 md:gap-10 [&>*]:break-inside-avoid' : 'max-w-reading'}
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
