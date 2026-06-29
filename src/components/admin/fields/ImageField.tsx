'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'petra-io-media';

/**
 * Visual image control: drag-and-drop or click to upload a file to Supabase
 * storage, then store + preview its public URL. No URL-pasting required, though
 * pasting a URL still works for externally-hosted images.
 */
export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErr('Please choose an image file.');
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '31536000', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>

      {value ? (
        <div className="group relative overflow-hidden rounded-md border border-ink/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-full bg-paper object-contain" />
          <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-ink/70 p-1.5 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-ink"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-magenta"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) upload(f);
          }}
          className={
            'flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs transition ' +
            (dragOver ? 'border-magenta bg-magenta/5 text-magenta' : 'border-ink/20 text-ink/50 hover:border-navy hover:text-navy')
          }
        >
          {uploading ? (
            <span>Uploading…</span>
          ) : (
            <>
              <span className="text-lg leading-none">⬆</span>
              <span>Click or drop an image</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = '';
        }}
      />

      {/* Manual URL fallback for externally-hosted images. */}
      <input
        className="mt-1.5 w-full rounded-md border border-ink/15 px-2 py-1 text-xs text-ink/60"
        placeholder="…or paste an image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {err && <span className="mt-1 block text-xs text-magenta">{err}</span>}
    </div>
  );
}
