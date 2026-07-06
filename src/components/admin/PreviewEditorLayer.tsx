'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Move,
} from 'lucide-react';
import { BLOCK_META } from '@/components/blocks/registry.meta';
import { parseBlockSize } from '@/components/blocks/blockSize';
import { postToParent, readBridge, type ToPreview } from './preview-bridge';
import type { BlockType } from '@/lib/types';

/** Minimal per-block info the server page hands the overlay. */
export type PreviewBlockInfo = { id: string; type: BlockType; size: string; locked: boolean };

// Height units → pixel floor (mirrors MIN_H in blockSize.ts at a 16px root).
const HEIGHT_PX: Record<string, number> = { '1': 0, '2': 384, '3': 544, '4': 704 };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const nearestHeight = (px: number): string =>
  (['1', '2', '3', '4'] as const).reduce((best, h) =>
    Math.abs(HEIGHT_PX[h] - px) < Math.abs(HEIGHT_PX[best] - px) ? h : best,
  '1');

type Rect = { top: number; left: number; width: number; height: number };
const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};
const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

/**
 * Interaction overlay mounted inside the live-preview iframe (edit mode only).
 * It renders no page content — it sits on top of the real, server-rendered
 * blocks and adds hover/selection outlines, a floating block toolbar, and
 * drag-to-resize handles that rewrite each tile's bento size in place. All state
 * changes are relayed to the parent <Editor> over the postMessage bridge; the
 * parent owns persistence.
 */
export function PreviewEditorLayer({ blocks }: { blocks: PreviewBlockInfo[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selRect, setSelRect] = useState<Rect | null>(null);
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);

  // Locked ids + live sizes are seeded from props then kept current by messages
  // (lock toggles) and local drags (resize). Refs avoid stale reads in handlers.
  const lockedRef = useRef<Set<string>>(new Set(blocks.filter((b) => b.locked).map((b) => b.id)));
  const sizeRef = useRef<Map<string, string>>(new Map(blocks.map((b) => [b.id, b.size || '4x1'])));
  const [size, setSize] = useState<string>('4x1');
  const draggingRef = useRef(false);

  const tileById = (id: string | null) =>
    id ? (document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null) : null;

  const select = useCallback((id: string | null) => {
    selectedIdRef.current = id;
    setSelectedId(id);
    setSize(id ? sizeRef.current.get(id) ?? '4x1' : '4x1');
  }, []);

  // ---- Receive selection / lock updates from the parent ---------------------
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const m = readBridge<ToPreview>(e);
      if (!m) return;
      if (m.type === 'select') {
        // Only scroll when the parent moved the selection somewhere new (e.g. via
        // the layers panel) — not when echoing back a click the user just made.
        const changed = m.id !== selectedIdRef.current;
        select(m.id);
        if (changed && m.id) tileById(m.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (m.type === 'locked') {
        lockedRef.current = new Set(m.ids);
      }
    };
    window.addEventListener('message', onMsg);
    postToParent({ type: 'ready' });
    return () => window.removeEventListener('message', onMsg);
  }, [select]);

  // ---- Hover + click selection ---------------------------------------------
  useEffect(() => {
    const closestId = (t: EventTarget | null): string | null =>
      (t instanceof Element ? t.closest('[data-block-id]') : null)?.getAttribute('data-block-id') ?? null;

    const onMove = (e: MouseEvent) => {
      if (draggingRef.current) return;
      const id = closestId(e.target);
      setHoverId(id);
      postToParent({ type: 'hover', id });
    };
    const onClick = (e: MouseEvent) => {
      // Ignore clicks on our own overlay controls (they stopPropagation anyway).
      const id = closestId(e.target);
      select(id);
      postToParent({ type: 'select', id });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick, true);
    };
  }, [select]);

  // ---- Keep outline rects glued to their tiles (content can reflow) ---------
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const sel = tileById(selectedId);
      const hov = hoverId && hoverId !== selectedId ? tileById(hoverId) : null;
      setSelRect((prev) => { const r = sel ? rectOf(sel) : null; return sameRect(prev, r) ? prev : r; });
      setHoverRect((prev) => { const r = hov ? rectOf(hov) : null; return sameRect(prev, r) ? prev : r; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selectedId, hoverId]);

  const locked = selectedId ? lockedRef.current.has(selectedId) : false;

  // ---- Resize drag ----------------------------------------------------------
  const startResize = (axis: 'w' | 'h') => (e: React.PointerEvent) => {
    if (!selectedId || locked) return;
    e.preventDefault();
    e.stopPropagation();
    const tile = tileById(selectedId);
    const grid = document.querySelector('[data-block-grid]') as HTMLElement | null;
    if (!tile || !grid) return;
    draggingRef.current = true;
    const colW = grid.getBoundingClientRect().width / 4;
    const { w: startW, h: startH } = parseBlockSize(sizeRef.current.get(selectedId));
    let w = Number(startW);
    let h = Number(startH);

    const onPointerMove = (ev: PointerEvent) => {
      const tr = tile.getBoundingClientRect();
      if (axis === 'w') {
        w = clamp(Math.round((ev.clientX - tr.left) / colW), 1, 4);
        tile.style.gridColumn = `span ${w}`;
      } else {
        h = Number(nearestHeight(ev.clientY - tr.top));
        tile.style.minHeight = HEIGHT_PX[String(h)] ? `${HEIGHT_PX[String(h)]}px` : '';
      }
      setSize(`${w}x${h}`);
    };
    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      draggingRef.current = false;
      const next = `${w}x${h}`;
      sizeRef.current.set(selectedId, next);
      setSize(next);
      postToParent({ type: 'resize', id: selectedId, size: next });
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  // Stepper fallback (accessible, precise) — commit immediately.
  const step = (axis: 'w' | 'h', delta: number) => {
    if (!selectedId || locked) return;
    const { w, h } = parseBlockSize(sizeRef.current.get(selectedId));
    let nw = Number(w);
    let nh = Number(h);
    if (axis === 'w') nw = clamp(nw + delta, 1, 4);
    else nh = clamp(nh + delta, 1, 4);
    const tile = tileById(selectedId);
    if (tile) {
      tile.style.gridColumn = `span ${nw}`;
      tile.style.minHeight = HEIGHT_PX[String(nh)] ? `${HEIGHT_PX[String(nh)]}px` : '';
    }
    const next = `${nw}x${nh}`;
    sizeRef.current.set(selectedId, next);
    setSize(next);
    postToParent({ type: 'resize', id: selectedId, size: next });
  };

  const act = (action: 'moveUp' | 'moveDown' | 'duplicate' | 'delete') => {
    if (!selectedId) return;
    postToParent({ type: 'action', action, id: selectedId });
  };

  const selType = selectedId
    ? (tileById(selectedId)?.getAttribute('data-block-type') as BlockType | null)
    : null;
  const label = selType ? BLOCK_META[selType]?.label ?? selType : '';

  // Toolbar sits just above the tile, flipping below when near the top.
  const toolbarTop = selRect ? (selRect.top > 52 ? selRect.top - 44 : selRect.top + 8) : 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden={false}>
      {/* Hover outline */}
      {hoverRect && (
        <div
          className="absolute rounded-sm ring-2 ring-navy/30 transition-[top,left,width,height] duration-75"
          style={{ top: hoverRect.top, left: hoverRect.left, width: hoverRect.width, height: hoverRect.height }}
        />
      )}

      {/* Selection outline + handles */}
      {selRect && (
        <>
          <div
            className="absolute rounded-sm ring-2 ring-magenta"
            style={{ top: selRect.top, left: selRect.left, width: selRect.width, height: selRect.height }}
          >
            {!locked && (
              <>
                {/* Right (width) handle */}
                <button
                  onPointerDown={startResize('w')}
                  title="Drag to resize width"
                  className="pointer-events-auto absolute -right-1.5 top-1/2 h-10 w-3 -translate-y-1/2 cursor-ew-resize rounded-full border border-white bg-magenta shadow"
                />
                {/* Bottom (height) handle */}
                <button
                  onPointerDown={startResize('h')}
                  title="Drag to resize height"
                  className="pointer-events-auto absolute -bottom-1.5 left-1/2 h-3 w-10 -translate-x-1/2 cursor-ns-resize rounded-full border border-white bg-magenta shadow"
                />
              </>
            )}
          </div>

          {/* Floating toolbar */}
          <div
            className="pointer-events-auto absolute flex items-center gap-0.5 rounded-md border border-ink/10 bg-white/95 px-1 py-0.5 text-ink shadow-lg backdrop-blur"
            style={{ top: toolbarTop, left: selRect.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-1 pl-1 pr-1.5 text-xs font-medium">
              <Move size={12} className="text-ink/40" />
              {label}
              {locked && <span className="text-ink/40">· locked</span>}
            </span>
            <Tb onClick={() => act('moveUp')} title="Move up"><ArrowUp size={14} /></Tb>
            <Tb onClick={() => act('moveDown')} title="Move down"><ArrowDown size={14} /></Tb>
            <Tb onClick={() => act('duplicate')} title="Duplicate"><Copy size={14} /></Tb>
            {!locked && (
              <span className="mx-0.5 flex items-center gap-0.5 rounded bg-paper px-1 text-[11px]">
                <Tb onClick={() => step('w', -1)} title="Narrower">W−</Tb>
                <span className="w-6 text-center tabular-nums">{size}</span>
                <Tb onClick={() => step('w', 1)} title="Wider">W+</Tb>
                <Tb onClick={() => step('h', 1)} title="Taller">H+</Tb>
                <Tb onClick={() => step('h', -1)} title="Shorter">H−</Tb>
              </span>
            )}
            <Tb onClick={() => act('delete')} title="Delete" danger><Trash2 size={14} /></Tb>
          </div>
        </>
      )}
    </div>
  );
}

function Tb({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={
        'flex h-6 min-w-6 items-center justify-center rounded px-1 text-xs hover:bg-ink/5 ' +
        (danger ? 'text-magenta' : 'text-ink/70')
      }
    >
      {children}
    </button>
  );
}
