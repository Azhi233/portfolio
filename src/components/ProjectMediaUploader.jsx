import { useState } from 'react';
import MediaPicker from './MediaPicker.jsx';
import MediaPreview from './MediaPreview.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';
import Select from './Select.jsx';

function getKind(item = {}) {
  return String(item.kind || '').startsWith('video') || /\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(String(item.url || '')) ? 'video' : 'image';
}

export default function ProjectMediaUploader({ items = [], uploading = false, progress = 0, uploadStage = 'idle', uploadStatus = '', uploadTarget = 'auto', onUpload, onRemove, onUpdate, onMoveUp, onMoveDown, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [batchFiles, setBatchFiles] = useState([]);

  const batchCount = batchFiles.length;

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return setDragIndex(null);
    onReorder?.(dragIndex, dropIndex);
    setDragIndex(null);
  };

  return (
    <div className="grid gap-4">
      <MediaPicker
        label="BTS Media"
        accept={uploadTarget === 'image' ? 'image/*' : uploadTarget === 'video' ? 'video/*' : 'image/*,video/*'}
        uploading={uploading}
        progress={progress}
        stage={uploadStage}
        statusText={uploadStatus}
        helperText="Upload BTS assets one by one or use the batch panel below to attach per-file metadata before saving."
        onPick={onUpload}
      />

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-zinc-400">BATCH UPLOAD</p>
            <p className="mt-1 text-sm text-zinc-500">Add multiple files, then fill in each file’s title, kind, and URL before adding them to the project.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.16em] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08]">
            SELECT FILES
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => {
                const next = Array.from(event.target.files || []).map((file) => ({
                  file,
                  title: file.name,
                  kind: file.type.startsWith('video/') ? 'video' : 'image',
                }));
                setBatchFiles(next);
                event.target.value = '';
              }}
            />
          </label>
        </div>

        {batchCount > 0 ? (
          <div className="mt-4 grid gap-3">
            <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0a0a0d]/95 p-3 backdrop-blur-md">
              <Button
                type="button"
                variant="primary"
                disabled={uploading}
                onClick={() => {
                  batchFiles.forEach((entry) => onUpload?.(entry.file, entry.kind, { title: entry.title }));
                }}
              >
                UPLOAD ALL
              </Button>
              <Button type="button" variant="subtle" onClick={() => setBatchFiles([])}>
                CLEAR LIST
              </Button>
            </div>
            {batchFiles.map((entry, index) => (
              <div key={`${entry.file?.name || 'file'}-${index}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">File title</p>
                    <Input
                      value={entry.title || ''}
                      onChange={(event) => setBatchFiles((prev) => prev.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))}
                    />
                  </label>
                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Kind</p>
                    <Select value={entry.kind || 'image'} onChange={(event) => setBatchFiles((prev) => prev.map((item, i) => (i === index ? { ...item, kind: event.target.value } : item)))}>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </Select>
                  </label>
                </div>
                <p className="mt-3 break-all text-xs text-zinc-500">{entry.file?.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={uploading}
                    onClick={() => onUpload?.(entry.file, entry.kind, { title: entry.title })}
                  >
                    UPLOAD
                  </Button>
                  <Button
                    type="button"
                    variant="subtle"
                    onClick={() => setBatchFiles((prev) => prev.filter((_, i) => i !== index))}
                  >
                    REMOVE
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item, index) => {
            const kind = getKind(item);
            return (
              <div
                key={item.id || `${item.url}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(index)}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                <div className="aspect-video border-b border-white/10 bg-black/40">
                  <MediaPreview src={item.url} title={item.title || item.label || `BTS ${index + 1}`} />
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] tracking-[0.16em] text-zinc-500">{kind.toUpperCase()}</span>
                    <span className="text-[11px] tracking-[0.16em] text-zinc-500">DRAG TO REORDER</span>
                  </div>
                  <input
                    value={item.title || item.label || ''}
                    onChange={(event) => onUpdate(index, { ...item, title: event.target.value, label: event.target.value })}
                    className="mb-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-white/25"
                    placeholder={`BTS ${index + 1}`}
                  />
                  <p className="break-all text-xs text-zinc-500">{item.url}</p>
                  <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-zinc-200">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isGroupCover)}
                      onChange={(event) => onUpdate(index, { ...item, isGroupCover: event.target.checked })}
                    />
                    <span>As group cover</span>
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="subtle" onClick={() => onMoveUp(index)} disabled={index === 0}>
                      UP
                    </Button>
                    <Button type="button" variant="subtle" onClick={() => onMoveDown(index)} disabled={index === items.length - 1}>
                      DOWN
                    </Button>
                    <Button type="button" variant="default" onClick={() => onRemove(index)}>
                      REMOVE
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
