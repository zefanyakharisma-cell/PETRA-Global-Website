'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImageCropModal } from './ImageCropModal';

const BUCKET = 'petra-io-media';

/**
 * Extract the file id from any Google Drive / Docs share link form, e.g.
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 *   https://docs.google.com/document/d/FILE_ID/edit
 * Returns null when the input isn't a Drive link.
 */
function driveFileId(input: string): string | null {
  if (!/drive\.google\.com|docs\.google\.com/.test(input)) return null;
  const m = input.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Turn a pasted URL into something that actually renders. A Drive share link is
 * rewritten to our same-origin proxy (which fetches the real bytes server-side);
 * everything else is passed through unchanged.
 */
function normalizeUrl(input: string): string {
  const id = driveFileId(input.trim());
  return id ? `/api/media?gdrive=${id}` : input;
}

/**
 * Visual image control: drag-and-drop or click to upload a file to Supabase
 * storage, then store + preview its public URL. Images can also be cropped
 * in-browser (pan/zoom/aspect) before saving. You can also paste an external
 * image URL — including a normal Google Drive share link, which is converted
 * automatically and served through our own origin.
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
  const [crop, setCrop] = useState<{ src: string; mime: string } | null>(null);

  /** Upload any image blob and return its public URL. */
  const uploadBlob = async (blob: Blob): Promise<string> => {
    const supabase = createClient();
    const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { cacheControl: '31536000', upsert: false, contentType: blob.type });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErr('Please choose an image file.');
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      onChange(await uploadBlob(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  /** Pull the current image into the cropper (as a same-origin object URL). */
  const openCrop = async () => {
    if (!value) return;
    setErr(null);
    setUploading(true);
    try {
      // Route our own storage images through the same-origin proxy so the
      // cropper's canvas is never cross-origin tainted. External (pasted) URLs
      // are fetched directly as a best effort.
      const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/${BUCKET}/`;
      const fetchUrl = base.length > 1 && value.startsWith(base) ? `/api/media?url=${encodeURIComponent(value)}` : value;
      const res = await fetch(fetchUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('Could not load image.');
      const blob = await res.blob();
      setCrop({ src: URL.createObjectURL(blob), mime: blob.type || 'image/png' });
    } catch {
      setErr('Could not load this image for cropping (it may block cross-origin access).');
    } finally {
      setUploading(false);
    }
  };

  const closeCrop = () => {
    if (crop) URL.revokeObjectURL(crop.src);
    setCrop(null);
  };

  const onCropped = async (blob: Blob) => {
    setUploading(true);
    try {
      onChange(await uploadBlob(blob));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
      closeCrop();
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
            <button type="button" onClick={openCrop} className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-ink">Crop</button>
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-ink">Replace</button>
            <button type="button" onClick={() => onChange('')} className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-magenta">Remove</button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-ink/70">Working…</div>
          )}
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

      {/* Manual URL entry for externally-hosted images, incl. Google Drive links. */}
      <input
        className="mt-1.5 w-full rounded-md border border-ink/15 px-2 py-1 text-xs text-ink/60"
        placeholder="…or paste an image URL or Google Drive link"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text');
          const normalized = normalizeUrl(pasted);
          if (normalized !== pasted) {
            e.preventDefault();
            onChange(normalized);
          }
        }}
        onBlur={(e) => {
          const normalized = normalizeUrl(e.target.value);
          if (normalized !== e.target.value) onChange(normalized);
        }}
      />
      {err && <span className="mt-1 block text-xs text-magenta">{err}</span>}

      {crop && (
        <ImageCropModal src={crop.src} mime={crop.mime} onCancel={closeCrop} onCropped={onCropped} />
      )}
    </div>
  );
}
