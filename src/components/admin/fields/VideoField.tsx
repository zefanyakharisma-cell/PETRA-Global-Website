'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveEmbed } from '@/lib/media';

const BUCKET = 'petra-io-media';

/**
 * Video control for gallery items. Two ways to supply a video:
 *   1. Upload a video file (MP4, WebM, MOV…) straight to Supabase storage.
 *   2. Paste a YouTube or Google Drive share link — or any direct video URL.
 * Stores a single URL string; playback surfaces resolve it via `resolveEmbed`
 * (YouTube / Drive → iframe) or a native `<video>` (uploaded / direct files).
 */
export function VideoField({
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
    if (!file.type.startsWith('video/')) {
      setErr('Please choose a video file.');
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type || 'video/mp4' });
      if (error) throw error;
      onChange(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const embed = value ? resolveEmbed(value) : null;
  const isIframe = embed && embed.kind !== 'iframe' ? true : false;

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>

      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-ink/15 bg-paper/50 p-2">
          <span className="rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
            {isIframe ? (embed?.kind === 'youtube' ? 'YT' : 'DRIVE') : 'VIDEO'}
          </span>
          <span className="flex-1 truncate text-xs text-ink/70" title={value}>{value}</span>
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded px-1.5 py-0.5 text-xs text-navy hover:bg-navy/5">Replace</button>
          <button type="button" onClick={() => onChange('')} className="rounded px-1.5 py-0.5 text-xs text-magenta hover:bg-magenta/5">Remove</button>
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
          {uploading ? <span>Uploading…</span> : <><span className="text-lg leading-none">▶</span><span>Click or drop a video (MP4, WebM…)</span></>}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }}
      />

      {/* Manual URL entry for YouTube / Google Drive / externally-hosted videos. */}
      <input
        className="mt-1.5 w-full rounded-md border border-ink/15 px-2 py-1 text-xs text-ink/60"
        placeholder="…or paste a YouTube / Google Drive / video URL"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
      />
      {err && <span className="mt-1 block text-xs text-magenta">{err}</span>}
    </div>
  );
}
