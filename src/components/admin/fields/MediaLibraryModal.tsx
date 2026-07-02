'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'petra-io-media';
const FOLDER = 'uploads';
const PAGE = 60;

type MediaItem = { name: string; url: string; size?: number; createdAt?: string };

/** Human file size, e.g. 2.3 MB. */
function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u++; }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

/**
 * Media library picker: lists every image already uploaded to the CMS storage
 * bucket (the `uploads/` folder) so editors can reuse a picture instead of
 * re-uploading it. Authenticated admins can list the bucket via the storage
 * "admin all" policy; the bucket is public, so previews use the public URL.
 */
export function MediaLibraryModal({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .list(FOLDER, { limit: PAGE, sortBy: { column: 'created_at', order: 'desc' } });
        if (error) throw error;
        const images = (data ?? [])
          // Real files only (folders have a null id), and images only.
          .filter((f) => f.id && (f.metadata?.mimetype ?? '').startsWith('image/'))
          .map((f) => ({
            name: f.name,
            url: supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${f.name}`).data.publicUrl,
            size: f.metadata?.size as number | undefined,
            createdAt: f.created_at ?? undefined,
          }));
        if (!cancelled) setItems(images);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load the media library.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2">
          <h3 className="font-condensed uppercase tracking-wide text-ink/70">Media library</h3>
          <button type="button" onClick={onClose} className="text-ink/40 hover:text-magenta">✕</button>
        </div>

        <div className="min-h-[240px] flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-ink/50">Loading…</div>
          ) : err ? (
            <div className="flex h-40 items-center justify-center text-sm text-magenta">{err}</div>
          ) : items.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-1 text-sm text-ink/50">
              <span>No images uploaded yet.</span>
              <span className="text-xs">Upload one and it will show up here for reuse.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  title={`${item.name}${item.size ? ` · ${formatSize(item.size)}` : ''}`}
                  onClick={() => { onSelect(item.url); onClose(); }}
                  className="group relative aspect-square overflow-hidden rounded-md border border-ink/15 bg-paper transition hover:border-navy hover:ring-2 hover:ring-navy/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-ink/10 px-4 py-2">
          <button type="button" onClick={onClose} className="rounded-md border border-ink/20 px-3 py-1.5 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
