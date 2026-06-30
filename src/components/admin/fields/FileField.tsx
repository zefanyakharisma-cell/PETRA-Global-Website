'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'petra-io-media';

/** Stored shape — URL plus the metadata a download card wants to display. */
export type FileValue = { url?: string; name?: string; size?: number };

/** Human file size, e.g. 2.3 MB. */
function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u++; }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

/** Extension badge from a filename or URL (PDF, DOCX, …). */
export function fileExt(v: FileValue | undefined): string {
  const src = v?.name || v?.url || '';
  const m = src.split('?')[0].match(/\.([a-z0-9]{1,5})$/i);
  return m ? m[1].toUpperCase() : 'FILE';
}

/**
 * Document upload control — drops any file (PDF, DOCX, XLSX, ZIP…) into Supabase
 * storage and stores its public URL alongside the original name + size so blocks
 * can render a proper download card. Mirrors ImageField, minus the cropper.
 */
export function FileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FileValue;
  onChange: (v: FileValue) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `documents/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type || 'application/octet-stream' });
      if (error) throw error;
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      onChange({ url, name: file.name, size: file.size });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const v = value ?? {};

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>

      {v.url ? (
        <div className="flex items-center gap-2 rounded-md border border-ink/15 bg-paper/50 p-2">
          <span className="rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">{fileExt(v)}</span>
          <span className="flex-1 truncate text-xs text-ink/70" title={v.name}>{v.name || v.url}</span>
          {v.size ? <span className="text-[11px] text-ink/40">{formatSize(v.size)}</span> : null}
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded px-1.5 py-0.5 text-xs text-navy hover:bg-navy/5">Replace</button>
          <button type="button" onClick={() => onChange({})} className="rounded px-1.5 py-0.5 text-xs text-magenta hover:bg-magenta/5">Remove</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
          className={
            'flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs transition ' +
            (dragOver ? 'border-magenta bg-magenta/5 text-magenta' : 'border-ink/20 text-ink/50 hover:border-navy hover:text-navy')
          }
        >
          {uploading ? <span>Uploading…</span> : <><span className="text-lg leading-none">⬆</span><span>Click or drop a file (PDF, DOCX, …)</span></>}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }}
      />

      {/* Manual URL entry for externally-hosted documents. */}
      <input
        className="mt-1.5 w-full rounded-md border border-ink/15 px-2 py-1 text-xs text-ink/60"
        placeholder="…or paste a file URL"
        value={v.url ?? ''}
        onChange={(e) => onChange({ ...v, url: e.target.value })}
      />
      {err && <span className="mt-1 block text-xs text-magenta">{err}</span>}
    </div>
  );
}
