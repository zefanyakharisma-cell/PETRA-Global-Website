'use client';

import type { EditorField, EditorSchema } from '@/components/blocks/registry.types';
import { ImageField } from './fields/ImageField';
import { FileField, type FileValue } from './fields/FileField';
import { LinkField } from './fields/LinkField';
import { RichTextEditor } from './fields/RichTextField';

type Dict = Record<string, unknown>;

export type EntityOption = { id: string; label: string };
export type EntityOptions = { staff: EntityOption[]; programs: EntityOption[] };

/**
 * Side-panel form generated from a block's EditorSchema, bound to its `config`
 * and `content`. Every field is edited visually — localized copy gets EN/ID
 * inputs, images upload to storage, rich text uses a WYSIWYG, repeatable
 * `list` fields render add/remove/reorder item cards, and entity references are
 * dropdowns. No JSON or markup is ever exposed to the editor.
 */
export function BlockForm({
  schema,
  config,
  content,
  entities,
  onChange,
}: {
  schema: EditorSchema;
  config: Dict;
  content: Dict;
  entities: EntityOptions;
  onChange: (next: { config: Dict; content: Dict }) => void;
}) {
  const setConfig = (key: string, value: unknown) => onChange({ config: { ...config, [key]: value }, content });
  const setContent = (key: string, value: unknown) => onChange({ config, content: { ...content, [key]: value } });

  return (
    <div className="space-y-5">
      {schema.config.length > 0 && (
        <Group title="Options">
          {schema.config.map((f) => (
            <FieldEditor key={f.key} field={f} value={config[f.key]} entities={entities} onChange={(v) => setConfig(f.key, v)} />
          ))}
        </Group>
      )}
      {schema.content.length > 0 && (
        <Group title="Content">
          {schema.content.map((f) => (
            <FieldEditor key={f.key} field={f} value={content[f.key]} entities={entities} onChange={(v) => setContent(f.key, v)} />
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

function FieldEditor({
  field,
  value,
  entities,
  onChange,
}: {
  field: EditorField;
  value: unknown;
  entities: EntityOptions;
  onChange: (v: unknown) => void;
}) {
  const label = <span className="mb-1 block text-xs font-medium text-ink/70">{field.label}</span>;
  const help = 'help' in field && field.help ? <span className="mt-1 block text-[11px] text-ink/40">{field.help}</span> : null;

  // Localized text / textarea: side-by-side EN / ID inputs.
  if ('localized' in field && field.localized && (field.type === 'text' || field.type === 'textarea')) {
    const v = (value as { en?: string; id?: string }) ?? {};
    const Tag = field.type === 'text' ? 'input' : 'textarea';
    return (
      <label className="block">
        {label}
        <div className="grid grid-cols-2 gap-2">
          <Tag className={input} placeholder="English" value={v.en ?? ''} onChange={(e) => onChange({ ...v, en: (e.target as HTMLInputElement).value })} />
          <Tag className={input} placeholder="Indonesian" value={v.id ?? ''} onChange={(e) => onChange({ ...v, id: (e.target as HTMLInputElement).value })} />
        </div>
        {help}
      </label>
    );
  }

  // Localized rich text: a WYSIWYG per locale.
  if (field.type === 'richtext') {
    if ('localized' in field && field.localized) {
      const v = (value as { en?: string; id?: string }) ?? {};
      return (
        <div className="block">
          {label}
          <div className="space-y-2">
            <div>
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink/40">English</span>
              <RichTextEditor value={v.en ?? ''} onChange={(html) => onChange({ ...v, en: html })} />
            </div>
            <div>
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink/40">Indonesian</span>
              <RichTextEditor value={v.id ?? ''} onChange={(html) => onChange({ ...v, id: html })} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="block">
        {label}
        <RichTextEditor value={(value as string) ?? ''} onChange={onChange} />
      </div>
    );
  }

  switch (field.type) {
    case 'text':
    case 'url':
      return <label className="block">{label}<input className={input} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.type === 'url' ? 'https://… or /page' : undefined} />{help}</label>;
    case 'textarea':
      return <label className="block">{label}<textarea className={input} rows={4} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />{help}</label>;
    case 'image':
      return <ImageField label={field.label} value={(value as string) ?? ''} onChange={onChange} />;
    case 'file':
      return <FileField label={field.label} value={(value as FileValue) ?? {}} onChange={onChange} />;
    case 'link':
      return <LinkField label={field.label} help={'help' in field ? field.help : undefined} value={(value as string) ?? ''} onChange={onChange} />;
    case 'date':
      return <label className="block">{label}<input type="date" className={input} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />{help}</label>;
    case 'number':
      return <label className="block">{label}<input type="number" className={input} value={(value as number | undefined) ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />{help}</label>;
    case 'boolean':
      return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{field.label}</label>;
    case 'select':
      return (
        <label className="block">{label}
          <select className={input} value={(value as string) ?? field.default ?? ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {help}
        </label>
      );
    case 'entity': {
      const opts = entities[field.entity] ?? [];
      return (
        <label className="block">{label}
          <select className={input} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">— None —</option>
            {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          {help}
        </label>
      );
    }
    case 'list':
      return <ListField field={field} value={value} entities={entities} onChange={onChange} />;
    default:
      return null;
  }
}

/** Build a blank item from a list's itemFields so "Add" yields editable fields. */
function blankItem(fields: EditorField[]): Dict {
  const o: Dict = {};
  for (const f of fields) {
    if (f.type === 'list') o[f.key] = [];
    else if (f.type === 'file') o[f.key] = {};
    else if (f.type === 'boolean') o[f.key] = false;
    else if (f.type === 'select') o[f.key] = f.options[0]?.value ?? '';
    else if ('localized' in f && f.localized) o[f.key] = {};
    else o[f.key] = '';
  }
  return o;
}

/** Short human summary of an item for its collapsed-card header. */
function itemSummary(item: Dict, fields: EditorField[]): string {
  for (const f of fields) {
    const v = item[f.key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const loc = v as { en?: string; id?: string };
      if (loc.en?.trim()) return loc.en.trim();
      if (loc.id?.trim()) return loc.id.trim();
    }
  }
  return 'New item';
}

function ListField({
  field,
  value,
  entities,
  onChange,
}: {
  field: Extract<EditorField, { type: 'list' }>;
  value: unknown;
  entities: EntityOptions;
  onChange: (v: unknown) => void;
}) {
  const items = (Array.isArray(value) ? value : []) as Dict[];

  const update = (next: Dict[]) => onChange(next);
  const setItem = (i: number, patch: Dict) => update(items.map((it, idx) => (idx === i ? patch : it)));
  const add = () => update([...items, blankItem(field.itemFields)]);
  const remove = (i: number) => update(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{field.label}</span>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-ink/15 bg-paper/50">
            <div className="flex items-center gap-1 border-b border-ink/10 px-2 py-1">
              <span className="flex-1 truncate text-xs font-medium text-ink/60">
                {i + 1}. {itemSummary(item, field.itemFields)}
              </span>
              <button type="button" title="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-ink/40 enabled:hover:text-navy disabled:opacity-30">↑</button>
              <button type="button" title="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="px-1 text-ink/40 enabled:hover:text-navy disabled:opacity-30">↓</button>
              <button type="button" title="Remove" onClick={() => remove(i)} className="px-1 text-ink/40 hover:text-magenta">✕</button>
            </div>
            <div className="space-y-3 p-2">
              {field.itemFields.map((sub) => (
                <FieldEditor
                  key={sub.key}
                  field={sub}
                  value={item[sub.key]}
                  entities={entities}
                  onChange={(v) => setItem(i, { ...item, [sub.key]: v })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 w-full rounded-md border border-dashed border-navy/40 py-1.5 text-xs font-medium text-navy hover:bg-navy/5"
      >
        + Add {field.label.replace(/s$/, '').toLowerCase() || 'item'}
      </button>
    </div>
  );
}
