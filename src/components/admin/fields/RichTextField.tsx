'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent, type Editor, type Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';

/**
 * Adds a `fontSize` attribute onto the TextStyle mark so the toolbar can offer
 * Word-like size presets. TipTap ships no official font-size extension, so this
 * small local one extends TextStyle to render/parse `style="font-size: …"`.
 */
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: { fontSize?: string | null }) =>
          attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
      },
    };
  },
});

// Marks shared by both editors — the "Word-like" inline formatting.
const MARK_EXTENSIONS: Extensions = [
  Underline,
  FontSize,
  Color,
  Highlight.configure({ multicolor: true }),
  Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
];

const FONT_SIZES = [
  { label: 'Size', value: '' },
  { label: 'Small', value: '0.85em' },
  { label: 'Normal', value: '1em' },
  { label: 'Large', value: '1.35em' },
  { label: 'Huge', value: '2em' },
];

/**
 * Strip the single wrapping paragraph TipTap emits so inline HTML can be
 * injected straight into a heading / span / button on the public page.
 */
function toInlineHTML(html: string): string {
  const trimmed = html.trim();
  const m = trimmed.match(/^<p[^>]*>([\s\S]*)<\/p>$/i);
  const inner = m ? m[1] : trimmed;
  // An "empty" paragraph is just a <br> or nothing — treat as blank.
  return inner === '<br>' || inner === '<br/>' ? '' : inner;
}

/**
 * WYSIWYG block rich-text control built on TipTap. Full Word-like toolbar —
 * headings, lists, quote, alignment plus inline marks. Stores clean HTML; used
 * for `richtext` fields (paragraph/body copy).
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ...MARK_EXTENSIONS,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose-block min-h-[120px] rounded-b-md border border-t-0 border-ink/20 bg-white px-3 py-2 text-sm focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} inline={false} />
      <EditorContent editor={editor} />
      {placeholder && !value && (
        <p className="mt-1 text-[11px] text-ink/40">{placeholder}</p>
      )}
    </div>
  );
}

/**
 * Single-line WYSIWYG for short display copy (headings, eyebrows, labels…).
 * Same inline marks as the block editor but no block nodes: Enter is swallowed
 * and the wrapping <p> is stripped on output, so the HTML drops cleanly into
 * whatever semantic tag the block renders it in.
 */
export function InlineRichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      ...MARK_EXTENSIONS,
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'rich-inline min-h-[38px] rounded-b-md border border-t-0 border-ink/20 bg-white px-3 py-2 text-sm focus:outline-none [&_p]:m-0',
      },
      // Single-line: never let Enter split into a second paragraph.
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(toInlineHTML(editor.getHTML())),
  });

  useEffect(() => {
    if (editor && toInlineHTML(editor.getHTML()) !== (value || '')) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} inline />
      <EditorContent editor={editor} />
      {placeholder && !value && (
        <p className="mt-1 text-[11px] text-ink/40">{placeholder}</p>
      )}
    </div>
  );
}

function Btn({
  onClick,
  active,
  label,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={
        'min-w-[28px] rounded px-1.5 py-0.5 text-xs font-medium ' +
        (active ? 'bg-navy text-white' : 'text-ink/70 hover:bg-ink/10')
      }
    >
      {label}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-4 w-px bg-ink/15" />;

/** Shared toolbar. `inline` hides block controls (headings/lists/quote/align). */
function Toolbar({ editor, inline }: { editor: Editor; inline: boolean }) {
  const setLink = () => {
    const prev = (editor.getAttributes('link').href as string) ?? '';
    const url = window.prompt('Link URL (leave blank to remove)', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-ink/20 bg-paper px-1 py-1">
      <Btn title="Bold" label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <Btn title="Italic" label="i" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <Btn title="Underline" label="U" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <Btn title="Strikethrough" label="S" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />

      {!inline && (
        <>
          <Sep />
          <Btn title="Heading 2" label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <Btn title="Heading 3" label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
          <Sep />
          <Btn title="Bullet list" label="•" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <Btn title="Numbered list" label="1." active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <Btn title="Quote" label="❝" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          <Sep />
          <Btn title="Align left" label="⟵" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
          <Btn title="Align center" label="↔" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
          <Btn title="Align right" label="⟶" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
        </>
      )}

      <Sep />
      {/* Font size presets */}
      <select
        title="Font size"
        className="rounded border border-ink/20 bg-white px-1 py-0.5 text-xs text-ink/70"
        value={(editor.getAttributes('textStyle').fontSize as string) ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
          else editor.chain().focus().setMark('textStyle', { fontSize: v }).run();
        }}
      >
        {FONT_SIZES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {/* Text colour */}
      <label title="Text colour" className="flex items-center">
        <span className="px-1 text-xs text-ink/70">A</span>
        <input
          type="color"
          className="h-5 w-5 cursor-pointer rounded border border-ink/20 bg-white p-0"
          value={(editor.getAttributes('textStyle').color as string) ?? '#1a1a2e'}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <Btn title="Highlight" label="🖍" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} />
      <Btn title="Link" label="🔗" active={editor.isActive('link')} onClick={setLink} />

      <Sep />
      <Btn title="Clear formatting" label="⌫" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} />
    </div>
  );
}
