'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
  Copy,
  Trash2,
  Minus,
  Plus,
  Bookmark,
  PanelLeft,
  PanelRight,
  Maximize2,
  Minimize2,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { BLOCK_META, BLOCK_META_LIST } from '@/components/blocks/registry.meta';
import { BLOCK_ICONS } from '@/components/blocks/registry.icons';
import { parseBlockSize, BLOCK_SIZE_DEFAULT } from '@/components/blocks/blockSize';
import { BlockForm, type EntityOptions } from './BlockForm';
import { clsx } from '@/lib/clsx';
import { postToFrame, readBridge, type FromPreview } from './preview-bridge';
import { SECTION_TEMPLATES, type BlockSeed } from '@/lib/sectionTemplates';
import {
  addBlock,
  updateBlock,
  deleteBlock,
  duplicateBlock,
  reorderBlocks,
  setOwnerPublished,
  syncBlocks,
  insertSection,
  savePreset,
  listPresets,
  deletePreset,
  type BlockOwner,
} from '@/app/admin/actions/cms';
import type { Block, BlockType } from '@/lib/types';

type Dict = Record<string, unknown>;
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved';
type Device = 'desktop' | 'tablet' | 'mobile';
type Preset = { id: string; name: string; payload: BlockSeed[] };

const DEVICE_WIDTH: Record<Device, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };
const LAYERS_W = 280; // px — width of the left (layers) drawer
const PROPS_W = 340; // px — width of the right (properties) drawer
const cloneBlocks = (bs: Block[]): Block[] =>
  bs.map((b) => ({ ...b, config: { ...b.config }, content: { ...b.content } }));

export function Editor({
  owner,
  slug,
  initialBlocks,
  initialPublished,
  entities,
}: {
  owner: BlockOwner;
  slug: string;
  initialBlocks: Block[];
  initialPublished: boolean;
  entities: EntityOptions;
}) {
  // Public path differs by owner: pages live at /<slug>, news at /news/<slug>.
  const publicPath = owner.kind === 'news' ? `news/${slug}` : slug;
  const previewPath = owner.kind === 'news' ? `news/${slug}` : slug;

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [published, setPublished] = useState<boolean>(initialPublished);
  const [selectedId, setSelectedId] = useState<string | null>(initialBlocks[0]?.id ?? null);
  const [locale, setLocale] = useState<'en' | 'id'>('en');
  const [device, setDevice] = useState<Device>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [picking, setPicking] = useState(false);
  // Fullscreen canvas + pop-out drawers. Panels overlay the edges of a
  // full-bleed preview; the canvas pads itself so nothing is ever hidden.
  const [fullscreen, setFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showProps, setShowProps] = useState(true);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [, startTransition] = useTransition();

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);
  const reloadPreview = () => setPreviewKey((k) => k + 1);

  // Mirror latest state into refs so message/keyboard handlers read fresh values.
  const blocksRef = useRef(blocks);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const lockedIds = useMemo(() => blocks.filter((b) => b.config.locked).map((b) => b.id), [blocks]);

  // Load saved presets once for the Templates tab.
  useEffect(() => { listPresets().then((p) => setPresets(p as Preset[])); }, []);

  // ---- Undo / redo history --------------------------------------------------
  // Snapshots of the whole block array captured *before* a property/order edit.
  // Structural changes (add/delete/duplicate/insert) reset history — undo does
  // not resurrect deleted rows (see syncBlocks). Field edits coalesce per block
  // via `armedRef` so a burst of typing is a single undo step.
  const past = useRef<Block[][]>([]);
  const future = useRef<Block[][]>([]);
  const armedRef = useRef<string | null>(null);
  const [histVer, setHistVer] = useState(0);

  const pushHistory = useCallback(() => {
    past.current.push(cloneBlocks(blocksRef.current));
    if (past.current.length > 50) past.current.shift();
    future.current = [];
    setHistVer((v) => v + 1);
  }, []);
  const resetHistory = useCallback(() => {
    past.current = [];
    future.current = [];
    armedRef.current = null;
    setHistVer((v) => v + 1);
  }, []);

  // ---- Debounced autosave (unchanged core) ---------------------------------
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ id: string; config: Dict; content: Dict } | null>(null);

  const flushSave = useCallback((refresh = true) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    setSaveState('saving');
    startTransition(async () => {
      await updateBlock(p.id, owner, slug, { config: p.config, content: p.content });
      setSaveState('saved');
      if (refresh) reloadPreview();
    });
  }, [owner, slug]);

  const scheduleSave = (id: string, config: Dict, content: Dict) => {
    if (pendingRef.current && pendingRef.current.id !== id) flushSave(false);
    pendingRef.current = { id, config, content };
    setSaveState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flushSave(true), 700);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const selectBlock = useCallback((id: string | null) => {
    flushSave(false);
    armedRef.current = null; // start a fresh edit session for the next block
    setSelectedId(id);
    if (id) setShowProps(true); // picking a block pops its properties drawer open
  }, [flushSave]);

  // ---- Persist a restored snapshot (undo/redo) ------------------------------
  const applySnapshot = useCallback((snap: Block[]) => {
    flushSave(false);
    setBlocks(snap);
    setSelectedId((cur) => (snap.some((b) => b.id === cur) ? cur : snap[0]?.id ?? null));
    startTransition(async () => {
      await syncBlocks(owner, slug, snap.map((b) => ({ id: b.id, config: b.config, content: b.content })));
      reloadPreview();
    });
  }, [flushSave, owner, slug]);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current.pop()!;
    future.current.push(cloneBlocks(blocksRef.current));
    armedRef.current = null;
    applySnapshot(prev);
    setHistVer((v) => v + 1);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current.pop()!;
    past.current.push(cloneBlocks(blocksRef.current));
    armedRef.current = null;
    applySnapshot(next);
    setHistVer((v) => v + 1);
  }, [applySnapshot]);

  // Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z / Ctrl+Y — but never hijack native text undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFullscreen(false); return; }
      if (!(e.ctrlKey || e.metaKey)) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ---- Bridge: receive selection / resize / actions from the preview --------
  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    const list = blocksRef.current;
    const idx = list.findIndex((b) => b.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= list.length) return;
    pushHistory();
    const next = arrayMove(list, idx, j);
    setBlocks(next);
    flushSave(false);
    startTransition(async () => { await reorderBlocks(next.map((b) => b.id), owner, slug); reloadPreview(); });
  }, [flushSave, owner, slug, pushHistory]);

  const applyResize = useCallback((id: string, size: string) => {
    const blk = blocksRef.current.find((b) => b.id === id);
    if (!blk || blk.config.locked) return;
    pushHistory();
    armedRef.current = null;
    const nextConfig = { ...blk.config, size };
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, config: nextConfig } : b)));
    flushSave(false);
    // Persist WITHOUT reloading — the overlay already shows the new size live.
    startTransition(async () => { await updateBlock(id, owner, slug, { config: nextConfig }); setSaveState('saved'); });
  }, [flushSave, owner, slug, pushHistory]);

  const onDuplicate = useCallback((id: string) => {
    flushSave(false);
    resetHistory();
    startTransition(async () => { await duplicateBlock(id, owner, slug); location.reload(); });
  }, [flushSave, owner, slug, resetHistory]);

  const onDelete = useCallback((id: string) => {
    if (pendingRef.current?.id === id) pendingRef.current = null;
    resetHistory();
    startTransition(async () => {
      await deleteBlock(id, owner, slug);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      reloadPreview();
    });
  }, [owner, slug, resetHistory]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const m = readBridge<FromPreview>(e);
      if (!m) return;
      switch (m.type) {
        case 'ready':
          postToFrame(iframeRef.current, { type: 'select', id: selectedIdRef.current });
          postToFrame(iframeRef.current, { type: 'locked', ids: blocksRef.current.filter((b) => b.config.locked).map((b) => b.id) });
          break;
        case 'select':
          selectBlock(m.id);
          break;
        case 'resize':
          applyResize(m.id, m.size);
          break;
        case 'action':
          if (m.action === 'moveUp') moveBlock(m.id, -1);
          else if (m.action === 'moveDown') moveBlock(m.id, 1);
          else if (m.action === 'duplicate') onDuplicate(m.id);
          else if (m.action === 'delete') onDelete(m.id);
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [selectBlock, applyResize, moveBlock, onDuplicate, onDelete]);

  // Reflect selection + lock changes down into a live (non-reloading) preview.
  useEffect(() => { postToFrame(iframeRef.current, { type: 'select', id: selectedId }); }, [selectedId, previewKey]);
  useEffect(() => { postToFrame(iframeRef.current, { type: 'locked', ids: lockedIds }); }, [lockedIds, previewKey]);

  // ---- Structural adds ------------------------------------------------------
  const onAdd = (type: BlockType) => {
    setPicking(false);
    flushSave(false);
    resetHistory();
    startTransition(async () => {
      const res = await addBlock(owner, type, slug);
      if (res?.ok && res.id) {
        const def = BLOCK_META[type];
        const ownerRef = owner.kind === 'news' ? { news_id: owner.id } : { page_id: owner.id };
        const nb: Block = { id: res.id, ...ownerRef, type, position: blocks.length, config: def.defaultConfig, content: def.defaultContent };
        setBlocks((prev) => [...prev, nb]);
        setSelectedId(res.id);
        reloadPreview();
      }
    });
  };

  const onInsertSection = (seeds: BlockSeed[]) => {
    setPicking(false);
    flushSave(false);
    resetHistory();
    startTransition(async () => {
      const res = await insertSection(owner, seeds as never, slug);
      if (res?.ok && res.ids) {
        const ownerRef = owner.kind === 'news' ? { news_id: owner.id } : { page_id: owner.id };
        const created: Block[] = res.ids.map((id, i) => ({
          id, ...ownerRef, type: seeds[i].type, position: blocks.length + i,
          config: seeds[i].config as Block['config'], content: seeds[i].content,
        }));
        setBlocks((prev) => [...prev, ...created]);
        setSelectedId(res.ids[0] ?? null);
        reloadPreview();
      }
    });
  };

  const onSaveAsPreset = (id: string) => {
    const blk = blocksRef.current.find((b) => b.id === id);
    if (!blk) return;
    const name = window.prompt('Save this block as a template. Name:', BLOCK_META[blk.type].label);
    if (!name) return;
    startTransition(async () => {
      await savePreset(name, [{ type: blk.type, config: blk.config, content: blk.content }]);
      setPresets(await listPresets() as Preset[]);
    });
  };

  const onDeletePreset = (id: string) => {
    startTransition(async () => { await deletePreset(id); setPresets((p) => p.filter((x) => x.id !== id)); });
  };

  // ---- Form + layers edits --------------------------------------------------
  const onFormChange = (next: { config: Dict; content: Dict }) => {
    if (!selected) return;
    if (armedRef.current !== selected.id) { pushHistory(); armedRef.current = selected.id; }
    setBlocks((prev) => prev.map((b) => (b.id === selected.id ? { ...b, config: next.config as Block['config'], content: next.content } : b)));
    scheduleSave(selected.id, next.config, next.content);
  };

  const toggleFlag = (id: string, flag: 'hidden' | 'locked') => {
    const blk = blocksRef.current.find((b) => b.id === id);
    if (!blk) return;
    pushHistory();
    armedRef.current = null;
    const nextConfig = { ...blk.config, [flag]: !blk.config[flag] };
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, config: nextConfig } : b)));
    startTransition(async () => {
      await updateBlock(id, owner, slug, { config: nextConfig });
      // Visibility changes what renders → reload; lock is editor-only → no reload.
      if (flag === 'hidden') reloadPreview();
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    pushHistory();
    flushSave(false);
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next);
    startTransition(async () => { await reorderBlocks(next.map((b) => b.id), owner, slug); reloadPreview(); });
  };

  const togglePublish = () => {
    const next = !published;
    setPublished(next);
    startTransition(async () => { await setOwnerPublished(owner, next, slug); });
  };

  const saveLabel =
    saveState === 'saving' ? 'Saving…' :
    saveState === 'dirty' ? 'Unsaved changes' :
    saveState === 'saved' ? 'All changes saved ✓' : '';

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;
  void histVer; // re-render trigger for canUndo/canRedo

  return (
    <div className={clsx('flex flex-col bg-white', fullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100vh-4rem)]')}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Left drawer toggle */}
          <IconBtn title={showLayers ? 'Hide layers' : 'Show layers'} active={showLayers} onClick={() => setShowLayers((v) => !v)}><Layers size={15} /></IconBtn>
          <span className="font-condensed uppercase tracking-wide text-ink/60">Editing</span>
          <span className="font-medium">/{publicPath}</span>
          {saveLabel && <span className="text-xs text-ink/40">{saveLabel}</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / redo */}
          <div className="flex overflow-hidden rounded-md border border-ink/20">
            <IconBtn title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}><Undo2 size={15} /></IconBtn>
            <IconBtn title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}><Redo2 size={15} /></IconBtn>
          </div>

          {/* Device width */}
          <div className="flex overflow-hidden rounded-md border border-ink/20">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
              <IconBtn key={d} title={d} active={device === d} onClick={() => setDevice(d)}><Icon size={15} /></IconBtn>
            ))}
          </div>

          {/* Locale */}
          <div className="flex overflow-hidden rounded-md border border-ink/20 text-sm">
            {(['en', 'id'] as const).map((l) => (
              <button key={l} onClick={() => { setLocale(l); reloadPreview(); }} className={l === locale ? 'bg-navy px-3 py-1 text-white' : 'px-3 py-1'}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <button onClick={togglePublish} className={'rounded-md px-4 py-1.5 text-sm font-medium ' + (published ? 'bg-green-600 text-white' : 'bg-amber text-ink')}>
            {published ? 'Published' : 'Publish'}
          </button>
          <a href={`/${locale}/${publicPath}`} target="_blank" rel="noreferrer" className="rounded-md border border-ink/20 px-3 py-1.5 text-sm">View live ↗</a>

          {/* Right drawer + fullscreen toggles */}
          <div className="flex overflow-hidden rounded-md border border-ink/20">
            <IconBtn title={showProps ? 'Hide properties' : 'Show properties'} active={showProps} onClick={() => setShowProps((v) => !v)}><SlidersHorizontal size={15} /></IconBtn>
            <IconBtn title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'} active={fullscreen} onClick={() => setFullscreen((v) => !v)}>
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </IconBtn>
          </div>
        </div>
      </div>

      {/* Full-bleed canvas with pop-out drawers overlaying the edges. The canvas
          pads itself to the open drawers so blocks are never hidden behind them. */}
      <div className="relative flex-1 overflow-hidden bg-ink/5">
        {/* Live preview (real components, draft state, interactive overlay) */}
        <div
          className="absolute inset-0 flex justify-center overflow-auto transition-[padding] duration-200"
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: (showLayers ? LAYERS_W : 0) + 16,
            paddingRight: (showProps ? PROPS_W : 0) + 16,
          }}
        >
          <iframe
            key={previewKey}
            ref={iframeRef}
            src={`/editor-preview/${previewPath}?locale=${locale}&edit=1`}
            style={{ width: DEVICE_WIDTH[device] }}
            className={clsx('h-full border-0 bg-white transition-[width] duration-200', device !== 'desktop' && 'rounded-lg border border-ink/15 shadow-lg')}
            title="Live preview"
          />
        </div>

        {/* Layers drawer (left) */}
        <aside
          className={clsx(
            'absolute inset-y-0 left-0 z-20 flex w-[280px] flex-col overflow-y-auto border-r border-ink/10 bg-paper/95 p-3 shadow-xl backdrop-blur transition-transform duration-200',
            showLayers ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-condensed text-sm uppercase tracking-wide text-ink/50"><Layers size={14} /> Layers</span>
            <button onClick={() => setShowLayers(false)} title="Hide layers" className="rounded p-1 text-ink/40 hover:bg-ink/5"><PanelLeft size={15} /></button>
          </div>
          <button onClick={() => setPicking((v) => !v)} className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-magenta py-2 font-condensed uppercase tracking-wide text-white">
            <Plus size={16} /> Add block
          </button>
          {picking && (
            <BlockPicker
              templates={SECTION_TEMPLATES}
              presets={presets}
              onPickBlock={onAdd}
              onInsertSection={onInsertSection}
              onDeletePreset={onDeletePreset}
            />
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1.5">
                {blocks.map((b) => (
                  <SortableBlockItem
                    key={b.id}
                    block={b}
                    selected={b.id === selectedId}
                    onSelect={() => selectBlock(b.id)}
                    onToggleHidden={() => toggleFlag(b.id, 'hidden')}
                    onToggleLocked={() => toggleFlag(b.id, 'locked')}
                    onSavePreset={() => onSaveAsPreset(b.id)}
                    onDuplicate={() => onDuplicate(b.id)}
                    onDelete={() => onDelete(b.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {blocks.length === 0 && <p className="text-sm text-ink/40">No blocks yet. Add one to start.</p>}
        </aside>

        {/* Properties drawer (right) */}
        <aside
          className={clsx(
            'absolute inset-y-0 right-0 z-20 flex w-[340px] flex-col overflow-y-auto border-l border-ink/10 bg-white/95 p-4 shadow-xl backdrop-blur transition-transform duration-200',
            showProps ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {selected ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="truncate font-condensed text-lg uppercase tracking-wide">{BLOCK_META[selected.type].label}</h2>
                <div className="flex items-center gap-2">
                  <SizeStepper
                    size={(selected.config.size as string) ?? BLOCK_SIZE_DEFAULT}
                    disabled={!!selected.config.locked}
                    onChange={(s) => applyResize(selected.id, s)}
                  />
                  <button onClick={() => setShowProps(false)} title="Hide properties" className="rounded p-1 text-ink/40 hover:bg-ink/5"><PanelRight size={15} /></button>
                </div>
              </div>
              {selected.config.locked && (
                <p className="mb-3 flex items-center gap-1.5 rounded-md bg-ink/5 px-2 py-1.5 text-xs text-ink/50">
                  <Lock size={12} /> Locked — unlock in the layers panel to edit size &amp; position.
                </p>
              )}
              <BlockForm
                schema={BLOCK_META[selected.type].editor}
                config={selected.config as Dict}
                content={selected.content as Dict}
                entities={entities}
                onChange={onFormChange}
              />
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/40">Select a block to edit.</p>
              <button onClick={() => setShowProps(false)} title="Hide properties" className="rounded p-1 text-ink/40 hover:bg-ink/5"><PanelRight size={15} /></button>
            </div>
          )}
        </aside>

        {/* Reopen tabs when a drawer is hidden — the "pop out" affordance. */}
        {!showLayers && (
          <button onClick={() => setShowLayers(true)} title="Show layers" className="absolute left-0 top-3 z-20 flex items-center gap-1 rounded-r-md border border-l-0 border-ink/15 bg-white py-2 pl-2 pr-2.5 text-xs font-medium shadow hover:bg-paper">
            <Layers size={14} /> Layers
          </button>
        )}
        {!showProps && (
          <button onClick={() => setShowProps(true)} title="Show properties" className="absolute right-0 top-3 z-20 flex items-center gap-1 rounded-l-md border border-r-0 border-ink/15 bg-white py-2 pl-2.5 pr-2 text-xs font-medium shadow hover:bg-paper">
            <SlidersHorizontal size={14} /> Properties
          </button>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  active,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center px-2.5 py-1.5 capitalize',
        active ? 'bg-navy text-white' : 'text-ink/70 hover:bg-ink/5',
        disabled && 'opacity-30',
      )}
    >
      {children}
    </button>
  );
}

/** Compact W×H stepper — the precise, accessible twin of the preview handles. */
function SizeStepper({ size, disabled, onChange }: { size: string; disabled?: boolean; onChange: (s: string) => void }) {
  const { w, h } = parseBlockSize(size);
  const clamp = (n: number) => Math.max(1, Math.min(4, n));
  const set = (nw: number, nh: number) => onChange(`${clamp(nw)}x${clamp(nh)}`);
  return (
    <div className={clsx('flex shrink-0 items-center gap-1 rounded-md border border-ink/15 px-1 py-0.5 text-xs', disabled && 'pointer-events-none opacity-40')}>
      {(['W', 'H'] as const).map((axis) => {
        const cur = axis === 'W' ? Number(w) : Number(h);
        return (
          <span key={axis} className="flex items-center gap-0.5">
            <span className="text-ink/40">{axis}</span>
            <button type="button" title={`${axis} smaller`} onClick={() => (axis === 'W' ? set(cur - 1, Number(h)) : set(Number(w), cur - 1))} className="rounded p-0.5 hover:bg-ink/5"><Minus size={12} /></button>
            <span className="w-3 text-center tabular-nums">{cur}</span>
            <button type="button" title={`${axis} larger`} onClick={() => (axis === 'W' ? set(cur + 1, Number(h)) : set(Number(w), cur + 1))} className="rounded p-0.5 hover:bg-ink/5"><Plus size={12} /></button>
          </span>
        );
      })}
    </div>
  );
}

function BlockPicker({
  templates,
  presets,
  onPickBlock,
  onInsertSection,
  onDeletePreset,
}: {
  templates: typeof SECTION_TEMPLATES;
  presets: Preset[];
  onPickBlock: (type: BlockType) => void;
  onInsertSection: (seeds: BlockSeed[]) => void;
  onDeletePreset: (id: string) => void;
}) {
  const [tab, setTab] = useState<'blocks' | 'templates'>('blocks');
  const categories = ['Layout & hero', 'Content', 'Entity-bound', 'Conversion'] as const;
  return (
    <div className="mb-3 rounded-lg border border-ink/10 bg-white p-2">
      <div className="mb-2 flex gap-1 rounded-md bg-paper p-0.5 text-xs">
        {(['blocks', 'templates'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx('flex-1 rounded px-2 py-1 font-condensed uppercase tracking-wide', tab === t ? 'bg-white shadow-sm' : 'text-ink/50')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'blocks' ? (
        categories.map((cat) => (
          <div key={cat} className="mb-2">
            <p className="px-1 font-condensed text-xs uppercase tracking-widest text-ink/40">{cat}</p>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {BLOCK_META_LIST.filter((d) => d.category === cat).map((d) => {
                const Icon = BLOCK_ICONS[d.type];
                return (
                  <button key={d.type} onClick={() => onPickBlock(d.type)} className="flex items-center gap-1.5 rounded-md bg-paper px-2 py-1.5 text-left text-xs hover:bg-navy hover:text-white">
                    <Icon size={13} className="shrink-0 opacity-60" /> {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-2">
          <div>
            <p className="px-1 font-condensed text-xs uppercase tracking-widest text-ink/40">Starter sections</p>
            <div className="mt-1 space-y-1">
              {templates.map((tpl) => (
                <button key={tpl.id} onClick={() => onInsertSection(tpl.blocks)} className="block w-full rounded-md bg-paper px-2 py-1.5 text-left hover:bg-navy hover:text-white">
                  <span className="text-xs font-medium">{tpl.name}</span>
                  <span className="block text-[11px] opacity-60">{tpl.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="px-1 font-condensed text-xs uppercase tracking-widest text-ink/40">Saved templates</p>
            {presets.length === 0 ? (
              <p className="px-1 py-1 text-[11px] text-ink/40">None yet — save a block from its layers row.</p>
            ) : (
              <div className="mt-1 space-y-1">
                {presets.map((p) => (
                  <div key={p.id} className="flex items-center gap-1 rounded-md bg-paper px-2 py-1.5">
                    <button onClick={() => onInsertSection(p.payload)} className="flex-1 truncate text-left text-xs font-medium hover:text-navy">{p.name}</button>
                    <button onClick={() => onDeletePreset(p.id)} title="Delete template" className="text-ink/30 hover:text-magenta"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableBlockItem({
  block,
  selected,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onSavePreset,
  onDuplicate,
  onDelete,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
  onSavePreset: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const Icon = BLOCK_ICONS[block.type];
  const hidden = !!block.config.hidden;
  const locked = !!block.config.locked;
  const size = (block.config.size as string) ?? BLOCK_SIZE_DEFAULT;

  return (
    <li ref={setNodeRef} style={style} className={clsx('rounded-md border bg-white', selected ? 'border-magenta ring-1 ring-magenta/30' : 'border-ink/10')}>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button {...attributes} {...listeners} className="cursor-grab text-ink/25 hover:text-ink/50" aria-label="Drag to reorder"><GripVertical size={14} /></button>
        <Icon size={14} className="shrink-0 text-ink/40" />
        <button onClick={onSelect} className={clsx('flex-1 truncate text-left text-sm', hidden ? 'text-ink/40 line-through' : 'text-ink/80')}>
          {BLOCK_META[block.type].label}
        </button>
        <span className="shrink-0 rounded bg-ink/5 px-1 text-[10px] tabular-nums text-ink/50">{size}</span>
      </div>
      {/* Row actions */}
      <div className={clsx('flex items-center gap-0.5 border-t px-1.5 py-0.5', selected ? 'border-magenta/20' : 'border-ink/5')}>
        <RowBtn title={hidden ? 'Show' : 'Hide'} onClick={onToggleHidden} active={hidden}>{hidden ? <EyeOff size={13} /> : <Eye size={13} />}</RowBtn>
        <RowBtn title={locked ? 'Unlock' : 'Lock'} onClick={onToggleLocked} active={locked}>{locked ? <Lock size={13} /> : <Unlock size={13} />}</RowBtn>
        <RowBtn title="Save as template" onClick={onSavePreset}><Bookmark size={13} /></RowBtn>
        <span className="flex-1" />
        <RowBtn title="Duplicate" onClick={onDuplicate}><Copy size={13} /></RowBtn>
        <RowBtn title="Delete" onClick={onDelete} danger><Trash2 size={13} /></RowBtn>
      </div>
    </li>
  );
}

function RowBtn({
  title,
  onClick,
  active,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={clsx(
        'rounded p-1 hover:bg-ink/5',
        active ? 'text-navy' : danger ? 'text-ink/40 hover:text-magenta' : 'text-ink/40 hover:text-navy',
      )}
    >
      {children}
    </button>
  );
}
