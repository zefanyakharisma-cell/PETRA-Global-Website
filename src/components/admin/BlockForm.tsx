'use client';

import { useState } from 'react';
import type { EditorField, EditorSchema } from '@/components/blocks/registry.types';

type Dict = Record<string, unknown>;

/**
 * Side-panel form generated from a block's EditorSchema, bound to its `config`
 * and `content`. Localized fields show EN/ID inputs. `list` fields are edited as
 * JSON (pragmatic for arbitrary nested item shapes).
 */
export function BlockForm({
  schema,
  config,
  content,
  onChange,
}: {
  schema: EditorSchema;
  config: Dict;
  content: Dict;
  onChange: (next: { config: Dict; content: Dict }) => void;
}) {
  const setConfig = (key: string, value: unknown) => onChange({ config: { ...config, [key]: value }, content });
  const setContent = (key: string, value: unknown) => onChange({ config, content: { ...content, [key]: value } });

  return (
    <div className="space-y-5">
      {schema.config.length > 0 && (
        <Group title="Options">
          {schema.config.map((f) => (
            <FieldEditor key={f.key} field={f} value={config[f.key]} onChange={(v) => setConfig(f.key, v)} />
          ))}
        </Group>
      )}
      {schema.content.length > 0 && (
        <Group title="Content">
          {schema.content.map((f) => (
            <FieldEditor key={f.key} field={f} value={content[f.key]} onChange={(v) => setContent(f.key, v)} />
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-ink/10 p-3">
      <legend className="px-1 font-condensed text-sm uppercase tracking-wide text-ink/50">{title}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

const input = 'w-full rounded-md border border-ink/20 px-2.5 py-1.5 text-sm';

function FieldEditor({ field, value, onChange }: { field: EditorField; value: unknown; onChange: (v: unknown) => void }) {
  const label = <span className="mb-1 block text-xs font-medium text-ink/70">{field.label}</span>;

  if ('localized' in field && field.localized && (field.type === 'text' || field.type === 'textarea' || field.type === 'richtext')) {
    const v = (value as { en?: string; id?: string }) ?? {};
    const Tag = field.type === 'text' ? 'input' : 'textarea';
    return (
      <label className="block">
        {label}
        <div className="grid grid-cols-2 gap-2">
          <Tag className={input} placeholder="EN" value={v.en ?? ''} onChange={(e) => onChange({ ...v, en: (e.target as HTMLInputElement).value })} />
          <Tag className={input} placeholder="ID" value={v.id ?? ''} onChange={(e) => onChange({ ...v, id: (e.target as HTMLInputElement).value })} />
        </div>
      </label>
    );
  }

  switch (field.type) {
    case 'text':
    case 'url':
    case 'image':
      return <label className="block">{label}<input className={input} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.type === 'image' ? 'Image URL' : undefined} /></label>;
    case 'textarea':
    case 'richtext':
      return <label className="block">{label}<textarea className={input} rows={4} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
    case 'number':
      return <label className="block">{label}<input type="number" className={input} value={(value as number) ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></label>;
    case 'boolean':
      return <label className="flex items-center gap-2 text-sm">{<input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />}{field.label}</label>;
    case 'select':
      return (
        <label className="block">{label}
          <select className={input} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      );
    case 'list':
      return <JsonField label={field.label} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function JsonField({ label, value, onChange }: { label: string; value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? [], null, 2));
  const [err, setErr] = useState<string | null>(null);
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label} (JSON list)</span>
      <textarea
        className={input + ' font-mono text-xs'}
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setErr(null);
          } catch {
            setErr('Invalid JSON');
          }
        }}
      />
      {err && <span className="text-xs text-magenta">{err}</span>}
    </label>
  );
}
