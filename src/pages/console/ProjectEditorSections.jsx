import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import ProjectMediaUploader from '../../components/ProjectMediaUploader.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import MediaPreview from '../../components/MediaPreview.jsx';

const displayTargets = [
  ['home', '主页'],
  ['images', '图片页'],
  ['videos', '视频页'],
  ['private', '私密页'],
];

export function ProjectBasicInfoSection({ draft, onUpdateDraft, onRefresh }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-zinc-500">BASIC INFO</p>
          <h3 className="mt-1 text-lg tracking-[0.08em] text-white">Project Details</h3>
        </div>
        <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Title</p>
          <Input value={draft.title} onChange={(event) => onUpdateDraft({ title: event.target.value })} />
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Category</p>
          <Input value={draft.category} onChange={(event) => onUpdateDraft({ category: event.target.value })} />
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client Agency</p>
          <Input value={draft.clientAgency || ''} onChange={(event) => onUpdateDraft({ clientAgency: event.target.value })} />
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client Code</p>
          <Input value={draft.clientCode || ''} onChange={(event) => onUpdateDraft({ clientCode: event.target.value })} />
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Password</p>
          <Input value={draft.accessPassword || ''} onChange={(event) => onUpdateDraft({ accessPassword: event.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Description</p>
          <Textarea value={draft.description || ''} onChange={(event) => onUpdateDraft({ description: event.target.value })} />
        </label>
      </div>
    </section>
  );
}

export function ProjectMediaSection({ draft, uploading, uploadProgress, uploadStage, uploadStatus, uploadFailureStage, uploadTarget, onToggleDisplayOn, onUploadImage, onUploadVideo, onUploadBts, onRemoveBts, onUpdateBts, onMoveBtsUp, onMoveBtsDown, onReorderBts }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-zinc-500">MEDIA</p>
          <h3 className="mt-1 text-lg tracking-[0.08em] text-white">Uploads</h3>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MediaPicker label="Image Upload" accept="image/*" value={draft.coverUrl} uploading={uploading} progress={uploadProgress} stage={uploadStage} statusText={uploadStatus} failedStage={uploadFailureStage} helperText="图片会显示在图片页。" onPick={onUploadImage} />
        <MediaPicker label="Video Upload" accept="video/*" value={draft.mainVideoUrl} uploading={uploading} progress={uploadProgress} stage={uploadStage} statusText={uploadStatus} failedStage={uploadFailureStage} helperText="视频会走转码逻辑并显示在视频页。" onPick={onUploadVideo} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[11px] tracking-[0.2em] text-zinc-500">DISPLAY TARGET</p>
        <h4 className="mt-2 text-base tracking-[0.08em] text-white">仅在以下页面显示</h4>
        <p className="mt-2 text-sm leading-7 text-zinc-400">勾选后，这条作品只会在选中的页面出现。</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {displayTargets.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
              <input type="checkbox" checked={Array.isArray(draft.displayOn) ? draft.displayOn.includes(value) : false} onChange={(event) => onToggleDisplayOn(value, event.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <ProjectMediaUploader
        items={Array.isArray(draft.btsMedia) ? draft.btsMedia : []}
        uploading={uploading}
        progress={uploadProgress}
        uploadStage={uploadStage}
        uploadStatus={uploadStatus}
        failedStage={uploadFailureStage}
        uploadTarget={uploadTarget}
        onUpload={onUploadBts}
        onRemove={onRemoveBts}
        onUpdate={onUpdateBts}
        onMoveUp={onMoveBtsUp}
        onMoveDown={onMoveBtsDown}
        onReorder={onReorderBts}
      />
    </section>
  );
}

export function ProjectTypeSection({ draft, onUpdateDraft }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[11px] tracking-[0.2em] text-zinc-500">TYPE</p>
        <h3 className="mt-2 text-lg tracking-[0.08em] text-white">Content Type</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ['image', '图片'],
            ['video', '视频'],
            ['private', '私密'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
              <input type="radio" name="kind" checked={String(draft.kind || draft.mediaType) === value} onChange={() => onUpdateDraft({ kind: value, mediaType: value === 'private' ? draft.mediaType || 'image' : value })} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Cover Preview</p>
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <MediaPreview src={draft.coverUrl} title="Cover preview" />
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-200">
          <p>当前内容类型：{draft.kind || 'image'}</p>
          <p className="mt-1 text-zinc-400">勾选页面后，只有这些页面会显示该作品。</p>
        </div>
      </div>
    </section>
  );
}

export function ProjectFlagsSection({ draft, onUpdateDraft }) {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="checkbox" checked={Boolean(draft.isVisible)} onChange={(event) => onUpdateDraft({ isVisible: event.target.checked })} />
        <span className="text-sm text-zinc-300">Visible</span>
      </label>
      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="checkbox" checked={Boolean(draft.isFeatured)} onChange={(event) => onUpdateDraft({ isFeatured: event.target.checked })} />
        <span className="text-sm text-zinc-300">Featured</span>
      </label>
      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
        <span className="text-sm text-zinc-300">Featured Order</span>
        <Input value={draft.featuredOrder || ''} onChange={(event) => onUpdateDraft({ featuredOrder: event.target.value })} placeholder="Auto" />
      </label>
    </section>
  );
}
