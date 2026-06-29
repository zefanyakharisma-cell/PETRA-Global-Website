'use client';

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getCroppedBlob, type CropArea } from './cropImage';

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: 'Free', value: undefined },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
  { label: '3:4', value: 3 / 4 },
];

/**
 * Modal cropper: pan/zoom over the source image, pick an aspect ratio, and emit
 * a cropped Blob. `src` must be a same-origin object URL so the canvas isn't
 * tainted. `mime` is preserved (PNG keeps transparency).
 */
export function ImageCropModal({
  src,
  mime,
  onCancel,
  onCropped,
}: {
  src: string;
  mime: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: unknown, pixels: CropArea) => setArea(pixels), []);

  const apply = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, area, mime);
      onCropped(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2">
          <h3 className="font-condensed uppercase tracking-wide text-ink/70">Crop image</h3>
          <button type="button" onClick={onCancel} className="text-ink/40 hover:text-magenta">✕</button>
        </div>

        <div className="relative h-[340px] w-full bg-ink/90">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>

        <div className="space-y-3 border-t border-ink/10 p-4">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-xs font-medium text-ink/60">Ratio:</span>
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => setAspect(a.value)}
                className={
                  'rounded px-2 py-0.5 text-xs font-medium ' +
                  (aspect === a.value ? 'bg-navy text-white' : 'bg-paper text-ink/70 hover:bg-ink/10')
                }
              >
                {a.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-ink/60">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-md border border-ink/20 px-3 py-1.5 text-sm">Cancel</button>
            <button type="button" onClick={apply} disabled={busy || !area} className="rounded-md bg-navy px-4 py-1.5 text-sm text-white disabled:opacity-50">
              {busy ? 'Applying…' : 'Apply crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
