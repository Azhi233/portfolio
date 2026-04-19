import { useState } from 'react';
import MediaPicker from './MediaPicker.jsx';
import MediaPreview from './MediaPreview.jsx';
import Button from './Button.jsx';

function getKind(item = {}) {
  return String(item.kind || '').startsWith('video') || /\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(String(item.url || '')) ? 'video' : 'image';
}

export default function ProjectMediaUploader({ items = [], uploading = false, progress = 0, uploadStage = 'idle', uploadStatus = '', uploadTarget = 'auto', onUpload, onRemove, onUpdate, onMoveUp, onMoveDown, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);

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
        helperText="Upload BTS assets one by one (videos are transcode-triggered on the server), then reorder or edit them below."
        onPick={onUpload}
      />

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
