'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

/**
 * WYSIWYG rich-text control built on TipTap. Edits visually and stores clean
 * HTML — admins never touch markup. Used for `richtext` fields.
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
    extensions: [StarterKit],
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

  // Keep the editor in sync when the bound value changes externally
  // (e.g. switching blocks or toggling EN/ID locale).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {placeholder && !value && (
        <p className="mt-1 text-[11px] text-ink/40">{placeholder}</p>
      )}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const Btn = ({
    onClick,
    active,
    label,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    title: string;
  }) => (
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

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-ink/20 bg-paper px-1 py-1">
      <Btn title="Bold" label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <Btn title="Italic" label="i" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <span className="mx-1 h-4 w-px bg-ink/15" />
      <Btn title="Heading 2" label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <Btn title="Heading 3" label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <span className="mx-1 h-4 w-px bg-ink/15" />
      <Btn title="Bullet list" label="•" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <Btn title="Numbered list" label="1." active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <Btn title="Quote" label="❝" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <span className="mx-1 h-4 w-px bg-ink/15" />
      <Btn title="Clear formatting" label="⌫" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} />
    </div>
  );
}
