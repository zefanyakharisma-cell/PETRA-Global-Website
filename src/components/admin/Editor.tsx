'use client';

import { useMemo, useState, useTransition } from 'react';
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
import { BLOCK_META, BLOCK_META_LIST } from '@/components/blocks/registry.meta';
import { BlockForm } from './BlockForm';
import {
  addBlock,
  updateBlock,
  deleteBlock,
  duplicateBlock,
  reorderBlocks,
  setPageStatus,
} from '@/app/admin/actions/cms';
import type { Block, BlockType, PageStatus } from '@/lib/types';

type Dict = Record<string, unknown>;

export function Editor({
  pageId,
  slug,
  initialBlocks,
  initialStatus,
}: {
  pageId: string;
  slug: string;
  initialBlocks: Block[];
  initialStatus: PageStatus;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [status, setStatus] = useState<PageStatus>(initialStatus);
  const [selectedId, setSelectedId] = useState<string | null>(initialBlocks[0]?.id ?? null);
  const [locale, setLocale] = useState<'en' | 'id'>('en');
  const [previewKey, setPreviewKey] = useState(0);
  const [picking, setPicking] = useState(false);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);
  const reloadPreview = () => setPreviewKey((k) => k + 1);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next);
    startTransition(async () => {
      await reorderBlocks(next.map((b) => b.id), slug);
      reloadPreview();
    });
  };

  const onAdd = (type: BlockType) => {
    setPicking(false);
    startTransition(async () => {
      const res = await addBlock(pageId, type, slug);
      if (res?.ok && res.id) {
        const def = BLOCK_META[type];
        const nb: Block = { id: res.id, page_id: pageId, type, position: blocks.length, config: def.defaultConfig, content: def.defaultContent };
        setBlocks((prev) => [...prev, nb]);
        setSelectedId(res.id);
        reloadPreview();
      }
    });
  };

  const onFormChange = (next: { config: Dict; content: Dict }) => {
    if (!selected) return;
    setBlocks((prev) => prev.map((b) => (b.id === selected.id ? { ...b, config: next.config as Block['config'], content: next.content } : b)));
  };

  const onSaveBlock = () => {
    if (!selected) return;
    startTransition(async () => {
      await updateBlock(selected.id, slug, { config: selected.config, content: selected.content });
      reloadPreview();
    });
  };

  const onDuplicate = (id: string) => startTransition(async () => { await duplicateBlock(id, slug); location.reload(); });
  const onDelete = (id: string) =>
    startTransition(async () => {
      await deleteBlock(id, slug);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      if (selectedId === id) setSelectedId(null);
      reloadPreview();
    });

  const togglePublish = () => {
    const next: PageStatus = status === 'published' ? 'draft' : 'published';
    setStatus(next);
    startTransition(async () => { await setPageStatus(pageId, next, slug); });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-condensed uppercase tracking-wide text-ink/60">Editing</span>
          <span className="font-medium">/{slug}</span>
          {pending && <span className="text-xs text-ink/40">saving…</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-ink/20 text-sm">
            {(['en', 'id'] as const).map((l) => (
              <button key={l} onClick={() => { setLocale(l); reloadPreview(); }} className={l === locale ? 'bg-navy px-3 py-1 text-white' : 'px-3 py-1'}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={togglePublish} className={'rounded-md px-4 py-1.5 text-sm font-medium ' + (status === 'published' ? 'bg-green-600 text-white' : 'bg-amber text-ink')}>
            {status === 'published' ? 'Published' : 'Publish'}
          </button>
          <a href={`/${locale}/${slug}`} target="_blank" rel="noreferrer" className="rounded-md border border-ink/20 px-3 py-1.5 text-sm">View live ↗</a>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
        {/* Block list */}
        <div className="overflow-y-auto border-r border-ink/10 bg-paper p-3">
          <button onClick={() => setPicking((v) => !v)} className="mb-3 w-full rounded-md bg-magenta py-2 font-condensed uppercase tracking-wide text-white">+ Add block</button>
          {picking && <BlockPicker onPick={onAdd} />}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {blocks.map((b) => (
                  <SortableBlockItem
                    key={b.id}
                    block={b}
                    selected={b.id === selectedId}
                    onSelect={() => setSelectedId(b.id)}
                    onDuplicate={() => onDuplicate(b.id)}
                    onDelete={() => onDelete(b.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {blocks.length === 0 && <p className="text-sm text-ink/40">No blocks yet. Add one to start.</p>}
        </div>

        {/* Live preview (real components, draft state) */}
        <div className="overflow-hidden bg-ink/5">
          <iframe key={previewKey} src={`/editor-preview/${slug}?locale=${locale}`} className="h-full w-full border-0" title="Live preview" />
        </div>

        {/* Side panel */}
        <div className="overflow-y-auto border-l border-ink/10 bg-white p-4">
          {selected ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-condensed text-lg uppercase tracking-wide">{BLOCK_META[selected.type].label}</h2>
                <button onClick={onSaveBlock} className="rounded-md bg-navy px-3 py-1.5 text-sm text-white">Save block</button>
              </div>
              <BlockForm
                schema={BLOCK_META[selected.type].editor}
                config={selected.config as Dict}
                content={selected.content as Dict}
                onChange={onFormChange}
              />
            </>
          ) : (
            <p className="text-sm text-ink/40">Select a block to edit, or add a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockPicker({ onPick }: { onPick: (type: BlockType) => void }) {
  const categories = ['Layout & hero', 'Content', 'Entity-bound', 'Conversion'] as const;
  return (
    <div className="mb-3 rounded-lg border border-ink/10 bg-white p-2">
      {categories.map((cat) => (
        <div key={cat} className="mb-2">
          <p className="px-1 font-condensed text-xs uppercase tracking-widest text-ink/40">{cat}</p>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {BLOCK_META_LIST.filter((d) => d.category === cat).map((d) => (
              <button key={d.type} onClick={() => onPick(d.type)} className="rounded-md bg-paper px-2 py-1.5 text-left text-xs hover:bg-navy hover:text-white">
                {d.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SortableBlockItem({
  block,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <li ref={setNodeRef} style={style} className={'rounded-md border bg-white p-2 ' + (selected ? 'border-magenta' : 'border-ink/10')}>
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-ink/30" aria-label="Drag to reorder">⠿</button>
        <button onClick={onSelect} className="flex-1 text-left font-condensed uppercase tracking-wide text-ink/80">
          {BLOCK_META[block.type].label}
        </button>
        <button onClick={onDuplicate} title="Duplicate" className="text-ink/40 hover:text-navy">⧉</button>
        <button onClick={onDelete} title="Delete" className="text-ink/40 hover:text-magenta">✕</button>
      </div>
    </li>
  );
}
