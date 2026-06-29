/** Pixel rectangle (natural image coordinates) produced by react-easy-crop. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for cropping.'));
    img.src = src;
  });
}

/**
 * Crop `src` to `area` (natural pixels) and return a Blob. Keeps PNG (for
 * transparency, e.g. logos); everything else becomes a quality-90 JPEG to keep
 * uploads small.
 */
export async function getCroppedBlob(src: string, area: CropArea, mime: string): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported.');

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, canvas.width, canvas.height,
  );

  const outMime = mime === 'image/png' ? 'image/png' : 'image/jpeg';
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed.'))),
      outMime,
      outMime === 'image/jpeg' ? 0.9 : undefined,
    );
  });
}
