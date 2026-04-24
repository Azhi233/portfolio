import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import { fetchJson } from '../../utils/api.js';
import ResizableMediaFrame from '../../components/ResizableMediaFrame.jsx';
import SlotNavigator from '../../components/SlotNavigator.jsx';
import SortableSection from '../../components/SortableSection.jsx';
import DraggableSlotCard from '../../components/DraggableSlotCard.jsx';
import DragHint from '../../components/DragHint.jsx';
import { applySlotPatch, buildEditorLayoutPayload, createEditorLayoutFromPayload, createInitialEditorState, editorMediaSlots, normalizeMediaItem } from './editorData.js';


const aspectOptions = ['16 / 9', '9 / 16', '4 / 3', '3 / 4', '1 / 1', '5 / 4'];

function groupSlots(slots) {
  return slots.reduce((acc, slot) => {
    const group = slot.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(slot);
    return acc;
  }, {});
}

function MediaTile({ slot, value, selected, editMode, onSelect, onEditText }) {
  const frameClasses = editMode ? 'border-dashed border-white/35 bg-white/[0.03]' : 'border-white/10 bg-black/20';
  const hasMedia = Boolean(value?.mediaUrl);
  const ratio = value?.aspectRatio || slot.aspectRatio || '4 / 3';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-[1.75rem] border p-3 text-left transition ${frameClasses} ${selected ? 'ring-2 ring-cyan-300/80' : 'hover:border-white/20'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">{slot.position}</p>
          <h3 className="mt-1 text-base tracking-[0.08em] text-white">{slot.label}</h3>
          <p className="mt-2 text-xs leading-6 text-zinc-400">{slot.description}</p>
        </div>
        <Badge tone={hasMedia ? 'success' : 'warning'}>{hasMedia ? 'ASSIGNED' : 'EMPTY'}</Badge>
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/30" style={{ aspectRatio: ratio }}>
        {hasMedia ? (
          <ResizableMediaFrame
            editMode={editMode}
            frame={{
              src: value.mediaUrl,
              alt: value.title,
              type: value.mediaType,
              aspectRatio: ratio,
              cropX: value.cropX || 50,
              cropY: value.cropY || 50,
              scale: value.scale || 1,
              width: value.width || 100,
              height: value.height || 100,
              x: value.x || 0,
              y: value.y || 0,
            }}
            onFrameChange={(nextFrame) => onEditText({
              cropX: nextFrame.cropX,
              cropY: nextFrame.cropY,
              scale: nextFrame.scale,
              width: nextFrame.width,
              height: nextFrame.height,
              x: nextFrame.x,
              y: nextFrame.y,
            })}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center border border-dashed border-white/10 text-sm text-zinc-500">
            Click to assign media
          </div>
        )}
      </div>

      {editMode ? (
        <div className="mt-3 grid gap-2 text-sm text-zinc-200">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={value?.title || ''}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onEditText({ title: event.target.value })}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-cyan-300/60"
              placeholder="Title"
            />
            <input
              value={value?.text || ''}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onEditText({ text: event.target.value })}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-cyan-300/60"
              placeholder="Text"
            />
          </div>
          <p className="text-xs text-zinc-500">Aspect {ratio}</p>
        </div>
      ) : null}
    </button>
  );
}

function MediaLibraryDrawer({ open, assets, currentSlot, onClose, onPickAsset, onUpdateSlot, onBatchSave }) {
  const [local, setLocal] = useState(currentSlot || null);

  useEffect(() => {
    setLocal(currentSlot || null);
  }, [currentSlot]);

  return (
    <Modal open={open} title="Select media" onClose={onClose}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {assets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onPickAsset(asset)}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2 text-left hover:border-cyan-300/50"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black/40">
                {asset.type === 'video' ? (
                  <video src={asset.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={asset.url} alt={asset.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-sm text-zinc-100">{asset.title}</p>
                <Badge tone={asset.type === 'video' ? 'warning' : 'success'}>{asset.type}</Badge>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] tracking-[0.22em] text-zinc-500">EDIT SLOT</p>
          <h3 className="mt-2 text-xl tracking-[0.08em] text-white">{local?.label || 'No slot selected'}</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">{local?.description || '选择素材后可以继续调整裁切位置、比例和文字，再统一保存。'}</p>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-zinc-400">
            <p className="text-zinc-300">页面位置说明</p>
            <p className="mt-1">{local?.position || '未绑定页面位置'}</p>
          </div>

          {local ? (
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm text-zinc-300">
                Aspect ratio
                <select
                  value={local.aspectRatio}
                  onChange={(event) => setLocal((prev) => ({ ...prev, aspectRatio: event.target.value }))}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
                >
                  {aspectOptions.map((ratio) => <option key={ratio}>{ratio}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Crop X
                <input type="range" min="0" max="100" value={local.cropX} onChange={(event) => setLocal((prev) => ({ ...prev, cropX: Number(event.target.value) }))} />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Crop Y
                <input type="range" min="0" max="100" value={local.cropY} onChange={(event) => setLocal((prev) => ({ ...prev, cropY: Number(event.target.value) }))} />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Scale
                <input type="range" min="1" max="2" step="0.01" value={local.scale} onChange={(event) => setLocal((prev) => ({ ...prev, scale: Number(event.target.value) }))} />
              </label>
              <Button type="button" variant="primary" onClick={() => onUpdateSlot(local.id, local)}>
                Apply to slot
              </Button>
              <Button type="button" variant="subtle" onClick={onBatchSave}>
                Save all changes
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default function EditorModePage() {
  const [slots, setSlots] = useState(createInitialEditorState());
  const [editMode, setEditMode] = useState(true);
  const [activeSlotId, setActiveSlotId] = useState(editorMediaSlots[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [draggedSlotId, setDraggedSlotId] = useState('');
  const [dragOverGroup, setDragOverGroup] = useState('');
  const [pendingSave, setPendingSave] = useState(false);
  const [unsavedCount, setUnsavedCount] = useState(0);
  const sectionsRef = useRef({});

  useEffect(() => {
    let mounted = true;
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const response = await fetchJson('/uploads');
        const normalized = Array.isArray(response) ? response.map(normalizeMediaItem).filter((item) => item.url) : [];
        if (mounted) setAssets(normalized);
      } catch {
        if (mounted) {
          setAssets([]);
        }
      } finally {
        if (mounted) {
          setLoadingAssets(false);
        }
      }
    };

    const loadLayout = async () => {
      try {
        const layout = await fetchJson('/config/editor-layout');
        if (mounted && layout) {
          setSlots(createEditorLayoutFromPayload(layout));
          showNotice('Loaded saved editor layout.');
        }
      } catch {
        if (mounted) {
          setSlots(createInitialEditorState());
        }
      }
    };

    loadAssets();
    loadLayout();
    return () => {
      mounted = false;
    };
  }, []);

  const groupedSlots = useMemo(() => groupSlots(editorMediaSlots), []);
  const activeSlot = useMemo(() => editorMediaSlots.find((slot) => slot.id === activeSlotId) || editorMediaSlots[0], [activeSlotId]);
  const activeValue = slots[activeSlotId];

  const markDirty = () => {
    setPendingSave(true);
    setUnsavedCount((count) => count + 1);
  };

  const showNotice = (message) => {
    setNotice(message);
    setNoticeVisible(true);
    window.clearTimeout(showNotice._timer);
    showNotice._timer = window.setTimeout(() => setNoticeVisible(false), 2400);
  };

  const updateSlot = (slotId, patch) => {
    setSlots((prev) => ({ ...prev, [slotId]: applySlotPatch(prev[slotId], patch) }));
    showNotice(`Updated ${slotId}`);
    markDirty();
  };

  const onPickAsset = (asset) => {
    updateSlot(activeSlotId, {
      mediaId: asset.id,
      mediaUrl: asset.url,
      mediaType: asset.type,
      title: asset.title,
      text: asset.title,
    });
  };

  const batchSave = async () => {
    if (pendingSave) return;
    setPendingSave(true);
    try {
      const payload = buildEditorLayoutPayload(slots);
      await fetchJson('/config/editor-layout', {
        method: 'PUT',
        data: payload,
      });
      showNotice('Editor layout saved to backend.');
      setUnsavedCount(0);
    } catch (error) {
      showNotice(error.message || 'Failed to save editor layout.');
    } finally {
      setPendingSave(false);
    }
  };

  const jumpToSlot = (slotId) => {
    const node = sectionsRef.current[slotId];
    node?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    setActiveSlotId(slotId);
  };

  const moveSlot = (slotId, direction) => {
    const currentIndex = editorMediaSlots.findIndex((slot) => slot.id === slotId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= editorMediaSlots.length) return;
    const currentSlot = editorMediaSlots[currentIndex];
    const targetSlot = editorMediaSlots[nextIndex];
    const currentValue = slots[currentSlot.id];
    const targetValue = slots[targetSlot.id];
    setSlots((prev) => {
      const next = { ...prev };
      next[currentSlot.id] = targetValue;
      next[targetSlot.id] = currentValue;
      return next;
    });
    showNotice('Swapped slot order locally.');
  };

  const handleSlotDrop = (sourceId, targetId) => {
    if (sourceId === targetId) return;
    const sourceIndex = editorMediaSlots.findIndex((slot) => slot.id === sourceId);
    const targetIndex = editorMediaSlots.findIndex((slot) => slot.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const sourceSlot = editorMediaSlots[sourceIndex];
    const targetSlot = editorMediaSlots[targetIndex];
    if (sourceSlot.group !== targetSlot.group) {
      showNotice('只能在同组内拖拽排序。');
      return;
    }
    const sourceValue = slots[sourceSlot.id];
    const targetValue = slots[targetSlot.id];
    setSlots((prev) => {
      const next = { ...prev };
      next[sourceSlot.id] = targetValue;
      next[targetSlot.id] = sourceValue;
      return next;
    });
    showNotice(`Reordered ${sourceSlot.label} and ${targetSlot.label}.`);
    markDirty();
  };

  const copySlot = (slotId) => {
    const source = slots[slotId];
    const cloneId = `${slotId}-copy`;
    setSlots((prev) => ({
      ...prev,
      [cloneId]: { ...source, title: `${source.title || activeSlot.label} Copy`, text: source.text || activeSlot.description, enabled: source.enabled },
    }));
    setActiveSlotId(cloneId);
    showNotice('Copied slot settings locally.');
    markDirty();
  };

  const resetSlot = (slotId) => {
    const base = createInitialEditorState()[slotId];
    setSlots((prev) => ({ ...prev, [slotId]: base }));
    showNotice('Slot reset to default.');
  };

  return (
    <main className="min-h-screen bg-[#f3eee6] px-4 py-6 text-[#1b1714] md:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <Card className="border-[#1b171420] bg-[#f8f4ee] p-6 shadow-[0_12px_40px_rgba(30,20,10,0.08)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-[#8b7768]">CONTENT MANAGER</p>
              <h1 className="mt-2 font-serif text-4xl tracking-[0.04em] text-[#16110d] md:text-6xl">Visual content editor</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e5248] md:text-base">
                像管理内容一样管理首页区块：每个 slot 都明确对应一个页面位置，选图、改字、调构图、保存发布都在这里完成。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={editMode ? 'editor' : 'subtle'} onClick={() => setEditMode((v) => !v)}>
                {editMode ? 'EDITING ON' : 'EDIT MODE'}
              </Button>
              <Button type="button" variant="editor" onClick={() => setDrawerOpen(true)}>SELECT MEDIA</Button>
              <Button type="button" variant="editor" onClick={batchSave}>{pendingSave ? 'SAVE CHANGES' : 'SAVE ALL'}</Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={loadingAssets ? 'warning' : 'success'}>{loadingAssets ? 'LOADING LIBRARY' : `${assets.length} MEDIA ITEMS`}</Badge>
            {pendingSave ? <Badge tone="warning">{unsavedCount} UNSAVED CHANGES</Badge> : null}
            {noticeVisible && notice ? <Badge tone="warning">{notice}</Badge> : null}
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
          <SlotNavigator groups={groupedSlots} activeId={activeSlotId} onJump={jumpToSlot} />

          <div className="grid gap-5">
            {Object.entries(groupedSlots).map(([group, groupSlotsList]) => (
              <SortableSection
                key={group}
                title={group === 'Hero' ? '首屏管理' : '作品管理'}
                count={groupSlotsList.length}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {groupSlotsList.map((slot, index) => (
                    <div key={slot.id} ref={(el) => { if (el) sectionsRef.current[slot.id] = el; }}>
                      <DraggableSlotCard
                        isDragging={draggedSlotId === slot.id}
                        onDragStart={() => setDraggedSlotId(slot.id)}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverGroup(group);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleSlotDrop(draggedSlotId, slot.id);
                          setDraggedSlotId('');
                          setDragOverGroup('');
                        }}
                      >
                        <div className={`mb-2 flex items-center justify-between text-[11px] tracking-[0.12em] text-[#8b7768] ${dragOverGroup === group ? 'opacity-100' : ''}`}>
                          <span className="flex items-center gap-2">
                            #{String(index + 1).padStart(2, '0')}
                            <DragHint active={draggedSlotId === slot.id} />
                          </span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => moveSlot(slot.id, -1)} className="rounded-full border border-[#1b17141f] bg-white px-2 py-1 text-[#1b1714]">↑</button>
                            <button type="button" onClick={() => moveSlot(slot.id, 1)} className="rounded-full border border-[#1b17141f] bg-white px-2 py-1 text-[#1b1714]">↓</button>
                            <button type="button" onClick={() => copySlot(slot.id)} className="rounded-full border border-[#1b17141f] bg-white px-2 py-1 text-[#1b1714]">Copy</button>
                            <button type="button" onClick={() => resetSlot(slot.id)} className="rounded-full border border-[#1b17141f] bg-white px-2 py-1 text-[#1b1714]">Reset</button>
                          </div>
                        </div>
                        <MediaTile
                          slot={slot}
                          value={slots[slot.id]}
                          selected={slot.id === activeSlotId}
                          editMode={editMode}
                          onSelect={() => {
                            setActiveSlotId(slot.id);
                            setDrawerOpen(true);
                          }}
                          onEditText={(patch) => updateSlot(slot.id, patch)}
                        />
                      </DraggableSlotCard>
                    </div>
                  ))}
                </div>
              </SortableSection>
            ))}
          </div>

          <Card className="border-[#1b171420] bg-[#f8f4ee] p-6 shadow-[0_12px_40px_rgba(30,20,10,0.08)]">
            <p className="text-[11px] tracking-[0.28em] text-[#8b7768]">ACTIVE SLOT</p>
            <h2 className="mt-2 text-2xl tracking-[0.06em] text-[#16110d]">{activeSlot.label}</h2>
            <p className="mt-3 text-sm leading-7 text-[#5e5248]">{activeSlot.description}</p>
            <div className="mt-3 rounded-2xl border border-[#1b17141f] bg-white px-4 py-3 text-xs leading-6 text-[#5e5248]">
              <p className="font-medium text-[#16110d]">页面位置说明</p>
              <p className="mt-1">{activeSlot.position}</p>
            </div>
            <label className="mt-4 flex items-center justify-between rounded-2xl border border-[#1b17141f] bg-white px-4 py-3 text-sm text-[#5e5248]">
              <span>启用该区块</span>
              <input type="checkbox" checked={activeValue?.enabled !== false} onChange={(event) => updateSlot(activeSlotId, { enabled: event.target.checked })} />
            </label>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-[#5e5248]">
                Title
                <Input value={activeValue?.title || ''} onChange={(event) => updateSlot(activeSlotId, { title: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm text-[#5e5248]">
                Text
                <Textarea value={activeValue?.text || ''} onChange={(event) => updateSlot(activeSlotId, { text: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm text-[#5e5248]">
                Aspect ratio
                <select
                  value={activeValue?.aspectRatio || activeSlot.aspectRatio}
                  onChange={(event) => updateSlot(activeSlotId, { aspectRatio: event.target.value })}
                  className="rounded-2xl border border-[#1b17141f] bg-white px-4 py-3 outline-none"
                >
                  {aspectOptions.map((ratio) => <option key={ratio}>{ratio}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[#5e5248]">
                Crop X
                <input type="range" min="0" max="100" value={activeValue?.cropX || 50} onChange={(event) => updateSlot(activeSlotId, { cropX: Number(event.target.value) })} />
              </label>
              <label className="grid gap-2 text-sm text-[#5e5248]">
                Crop Y
                <input type="range" min="0" max="100" value={activeValue?.cropY || 50} onChange={(event) => updateSlot(activeSlotId, { cropY: Number(event.target.value) })} />
              </label>
              <label className="grid gap-2 text-sm text-[#5e5248]">
                Scale
                <input type="range" min="1" max="2" step="0.01" value={activeValue?.scale || 1} onChange={(event) => updateSlot(activeSlotId, { scale: Number(event.target.value) })} />
              </label>
            </div>
          </Card>
        </div>
      </section>

      <MediaLibraryDrawer
        open={drawerOpen}
        assets={assets}
        currentSlot={{ id: activeSlotId, label: activeSlot.label, ...activeValue, description: activeSlot.description, position: activeSlot.position }}
        onClose={() => setDrawerOpen(false)}
        onPickAsset={onPickAsset}
        onUpdateSlot={(slotId, patch) => {
          updateSlot(slotId, patch);
          setDrawerOpen(false);
        }}
        onBatchSave={batchSave}
      />
      {pendingSave ? (
        <button type="button" disabled={pendingSave} onClick={batchSave} className="fixed bottom-6 right-6 rounded-full border border-emerald-300/40 bg-emerald-500 px-4 py-3 text-sm text-white shadow-lg transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70">
          {pendingSave ? 'Saving...' : `Save ${unsavedCount} changes`}
        </button>
      ) : null}
    </main>
  );
}
