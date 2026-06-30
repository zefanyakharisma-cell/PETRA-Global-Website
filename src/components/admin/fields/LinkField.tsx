'use client';

/**
 * Smart link control. Outputs a plain href string (so every block that already
 * reads `href` keeps working), but guides the editor with a "kind" selector that
 * manages the right prefix — internal page, external URL, email, phone, or
 * WhatsApp — instead of expecting them to remember `mailto:` / `tel:` syntax.
 */

type Kind = 'page' | 'url' | 'email' | 'phone' | 'whatsapp';

const KINDS: { value: Kind; label: string; placeholder: string }[] = [
  { value: 'page', label: 'Page on this site', placeholder: '/partnership' },
  { value: 'url', label: 'External URL', placeholder: 'https://…' },
  { value: 'email', label: 'Email', placeholder: 'name@petra.ac.id' },
  { value: 'phone', label: 'Phone', placeholder: '+62 31 …' },
  { value: 'whatsapp', label: 'WhatsApp', placeholder: '6281…' },
];

const input = 'w-full rounded-md border border-ink/20 px-2.5 py-1.5 text-sm';

/** Split a stored href back into its editable kind + bare value. */
function parse(href: string): { kind: Kind; bare: string } {
  const v = (href ?? '').trim();
  if (v.startsWith('mailto:')) return { kind: 'email', bare: v.slice(7) };
  if (v.startsWith('tel:')) return { kind: 'phone', bare: v.slice(4) };
  const wa = v.match(/^https?:\/\/wa\.me\/(.+)$/);
  if (wa) return { kind: 'whatsapp', bare: wa[1] };
  if (/^https?:\/\//i.test(v)) return { kind: 'url', bare: v };
  return { kind: 'page', bare: v };
}

/** Rebuild a stored href from a kind + the user-typed bare value. */
function build(kind: Kind, bare: string): string {
  const b = bare.trim();
  if (!b) return '';
  switch (kind) {
    case 'email': return `mailto:${b}`;
    case 'phone': return `tel:${b.replace(/\s+/g, '')}`;
    case 'whatsapp': return `https://wa.me/${b.replace(/[^\d]/g, '')}`;
    default: return b; // page + url stored verbatim
  }
}

export function LinkField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (href: string) => void;
}) {
  const { kind, bare } = parse(value ?? '');
  const meta = KINDS.find((k) => k.value === kind)!;

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
      <div className="grid grid-cols-[130px_1fr] gap-2">
        <select className={input} value={kind} onChange={(e) => onChange(build(e.target.value as Kind, bare))}>
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <input
          className={input}
          placeholder={meta.placeholder}
          value={bare}
          onChange={(e) => onChange(build(kind, e.target.value))}
        />
      </div>
      {help && <span className="mt-1 block text-[11px] text-ink/40">{help}</span>}
    </div>
  );
}
