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

function SectionShell({ eyebrow, title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 md:p-5 ${className}`.trim()}>
      <div className="mb-4">
        <p className="text-[10px] tracking-[0.2em] text-zinc-500">{eyebrow}</p>
        <h3 className="mt-1 text-base tracking-[0.08em] text-white md:text-lg">{title}</h3>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-zinc-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ProjectBasicInfoSection({ draft, onUpdateDraft, onRefresh }) {
  return (
    <SectionShell eyebrow="BASIC INFO" title="Project Details" subtitle="基础信息和项目可见内容。">
      <div className="mb-4 flex justify-end">
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
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Release Date</p>
          <Input value={draft.releaseDate || ''} onChange={(event) => onUpdateDraft({ releaseDate: event.target.value })} placeholder="YYYY-MM-DD" />
        </label>
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Description</p>
          <Textarea value={draft.description || ''} onChange={(event) => onUpdateDraft({ description: event.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Credits</p>
          <Textarea value={draft.credits || ''} onChange={(event) => onUpdateDraft({ credits: event.target.value })} placeholder="Crew / agency / contributors" />
        </label>
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Delivery Pin</p>
          <Input value={draft.deliveryPin || ''} onChange={(event) => onUpdateDraft({ deliveryPin: event.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Role</p>
          <Input value={draft.role || ''} onChange={(event) => onUpdateDraft({ role: event.target.value })} />
        </label>
      </div>
    </SectionShell>
  );
}

export function ProjectMediaSection({ draft, uploading, uploadProgress, uploadStage, uploadStatus, uploadFailureStage, uploadTarget, onToggleDisplayOn, onUploadImage, onUploadVideo, onUploadBts, onRemoveBts, onUpdateBts, onMoveBtsUp, onMoveBtsDown, onReorderBts }) {
  return (
    <SectionShell eyebrow="MEDIA" title="Uploads" subtitle="封面、主视频和 BTS 媒体。">
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
    </SectionShell>
  );
}

export function ProjectTypeSection({ draft, onUpdateDraft }) {
  return (
    <SectionShell eyebrow="TYPE" title="Content Type" subtitle="项目内容类型与展示预览。">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
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
      </div>
    </SectionShell>
  );
}

export function ProjectFlagsSection({ draft, onUpdateDraft }) {
  return (
    <SectionShell eyebrow="FLAGS" title="Visibility & Status" subtitle="公开状态、精选和排序。">
      <div className="grid gap-3 md:grid-cols-2">
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
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
          <span className="text-sm text-zinc-300">Visibility</span>
          <select
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#0c0d10] px-4 py-2 text-sm text-zinc-100 outline-none"
            value={draft.visibility || 'public'}
            onChange={(event) => onUpdateDraft({ visibility: event.target.value })}
          >
            <option value="public">public</option>
            <option value="private">private</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
          <span className="text-sm text-zinc-300">Status</span>
          <Input value={draft.status || 'draft'} onChange={(event) => onUpdateDraft({ status: event.target.value })} />
        </label>
        <label className="block rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Outline Tags</p>
          <Textarea
            value={Array.isArray(draft.outlineTags) ? draft.outlineTags.join(', ') : ''}
            onChange={(event) => onUpdateDraft({ outlineTags: String(event.target.value || '').split(',').map((item) => item.trim()).filter(Boolean) })}
            placeholder="tag-1, tag-2, tag-3"
          />
        </label>
      </div>
    </SectionShell>
  );
}

export function ProjectPrivateFilesSection({ draft, onUpdateDraft }) {
  const files = Array.isArray(draft.privateFiles) ? draft.privateFiles : [];

  const updateFile = (index, patch) => {
    const next = files.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onUpdateDraft({ privateFiles: next });
  };

  const addFile = () => {
    onUpdateDraft({
      privateFiles: [...files, { title: '', url: '', kind: 'file', isPrivate: true }],
    });
  };

  const removeFile = (index) => {
    onUpdateDraft({ privateFiles: files.filter((_, i) => i !== index) });
  };

  return (
    <SectionShell eyebrow="PRIVATE FILES" title="Private Files" subtitle="私密文件列表会随项目一起保存。">
      <div className="flex justify-end">
        <Button type="button" variant="subtle" onClick={addFile}>ADD FILE</Button>
      </div>
      <div className="mt-4 grid gap-3">
        {files.length === 0 ? <p className="text-sm text-zinc-500">No private files yet.</p> : null}
        {files.map((file, index) => (
          <div key={`${file.url || 'private-file'}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Title</p>
                <Input value={file.title || ''} onChange={(event) => updateFile(index, { title: event.target.value })} />
              </label>
              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Kind</p>
                <Input value={file.kind || 'file'} onChange={(event) => updateFile(index, { kind: event.target.value })} />
              </label>
              <label className="block md:col-span-2">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">URL</p>
                <Input value={file.url || ''} onChange={(event) => updateFile(index, { url: event.target.value })} />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 md:col-span-2">
                <input type="checkbox" checked={file.isPrivate !== false} onChange={(event) => updateFile(index, { isPrivate: event.target.checked })} />
                <span>Private</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="danger" onClick={() => removeFile(index)}>REMOVE</Button>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
