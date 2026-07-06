/**
 * Tiny typed postMessage protocol connecting the parent <Editor> to the
 * interaction overlay running inside the live-preview iframe. Both documents are
 * same-origin (same Next app), so we still namespace every message with a
 * `source` marker to ignore unrelated traffic (React DevTools, Next HMR, etc.).
 */

export const BRIDGE_SOURCE = 'petra-cms';

/** Messages the iframe overlay sends up to the parent Editor. */
export type FromPreview =
  | { source: typeof BRIDGE_SOURCE; type: 'ready' }
  | { source: typeof BRIDGE_SOURCE; type: 'select'; id: string | null }
  | { source: typeof BRIDGE_SOURCE; type: 'hover'; id: string | null }
  /** A committed resize — `size` is a `WxH` string (e.g. "2x1"). */
  | { source: typeof BRIDGE_SOURCE; type: 'resize'; id: string; size: string }
  | {
      source: typeof BRIDGE_SOURCE;
      type: 'action';
      action: 'moveUp' | 'moveDown' | 'duplicate' | 'delete';
      id: string;
    };

/** Messages the parent Editor pushes down into the iframe overlay. */
export type ToPreview =
  | { source: typeof BRIDGE_SOURCE; type: 'select'; id: string | null }
  /** Ids the overlay must treat as non-interactive (locked blocks). */
  | { source: typeof BRIDGE_SOURCE; type: 'locked'; ids: string[] };

// Distribute Omit over each union member so every message variant keeps its own
// payload keys (a plain `Omit<Union, 'source'>` would collapse to the shared key).
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export function postToParent(msg: DistributiveOmit<FromPreview, 'source'>) {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage({ ...msg, source: BRIDGE_SOURCE }, window.location.origin);
}

export function postToFrame(frame: HTMLIFrameElement | null, msg: DistributiveOmit<ToPreview, 'source'>) {
  frame?.contentWindow?.postMessage({ ...msg, source: BRIDGE_SOURCE }, window.location.origin);
}

/** Narrow an incoming MessageEvent to one of our bridge messages. */
export function readBridge<T extends { source: typeof BRIDGE_SOURCE }>(e: MessageEvent): T | null {
  const d = e.data;
  if (d && typeof d === 'object' && d.source === BRIDGE_SOURCE) return d as T;
  return null;
}
