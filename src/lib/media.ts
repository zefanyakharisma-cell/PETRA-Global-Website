/**
 * Central media-URL helpers so admins can paste ordinary share links from
 * YouTube and Google Drive — for both images and videos — and have them render
 * correctly on the public site and in the editor.
 *
 * A pasted link almost never points at the raw media: a YouTube *watch* URL and
 * a Drive *share* URL are HTML viewer pages that refuse to be `<iframe>`d or
 * `<img>`d directly. These helpers rewrite them into the embeddable / streamable
 * form each surface needs. Kept dependency-free so both server components
 * (EmbedBlock) and client components (ImageField, ScrollExpandHero) share one
 * source of truth.
 */

/** Pull a YouTube video id out of watch / youtu.be / embed / shorts / live URLs. */
export function youtubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * Pull the file id from any Google Drive / Docs share link, e.g.
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 *   https://docs.google.com/document/d/FILE_ID/edit
 * Returns null when the input isn't a Drive/Docs link.
 */
export function driveFileId(url: string): string | null {
  if (!/drive\.google\.com|docs\.google\.com/.test(url)) return null;
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Rewrite a pasted URL to something that renders as an `<img>`. A Google Drive
 * share link becomes our same-origin proxy (which streams the real image bytes
 * from Drive's thumbnail endpoint — see `/api/media`); anything else is returned
 * trimmed but unchanged.
 */
export function normalizeImageUrl(input: string): string {
  const trimmed = input.trim();
  const id = driveFileId(trimmed);
  return id ? `/api/media?gdrive=${id}` : trimmed;
}

export type ResolvedEmbed =
  | { kind: 'youtube' | 'drive' | 'iframe'; src: string }
  | null;

/**
 * Resolve a pasted URL for the Embed block's `<iframe>`. YouTube watch / short /
 * share links become privacy-friendly embed URLs; Google Drive share links
 * become the file `/preview` player (works for video and most file types);
 * everything else is iframed as-is (an already-embeddable URL, a Google Map,
 * Spotify, etc.).
 */
export function resolveEmbed(url: string | undefined): ResolvedEmbed {
  const u = url?.trim();
  if (!u) return null;
  const yt = youtubeId(u);
  if (yt) return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0` };
  const gd = driveFileId(u);
  if (gd) return { kind: 'drive', src: `https://drive.google.com/file/d/${gd}/preview` };
  return { kind: 'iframe', src: u };
}

export type ResolvedVideo =
  | { kind: 'youtube' | 'drive'; src: string }
  | { kind: 'file'; src: string }
  | null;

/**
 * Resolve a video URL for an autoplaying background player (the scroll-expand
 * hero). YouTube + Drive render in an `<iframe>` with autoplay/mute/loop where
 * the platform allows; anything else is treated as a direct file for `<video>`.
 */
export function resolveAutoplayVideo(url: string | undefined): ResolvedVideo {
  const u = url?.trim();
  if (!u) return null;
  const yt = youtubeId(u);
  if (yt) {
    const params =
      'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playsinline=1';
    return { kind: 'youtube', src: `https://www.youtube.com/embed/${yt}?${params}&playlist=${yt}` };
  }
  const gd = driveFileId(u);
  if (gd) return { kind: 'drive', src: `https://drive.google.com/file/d/${gd}/preview` };
  return { kind: 'file', src: u };
}
