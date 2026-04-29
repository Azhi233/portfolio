import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import ProjectMediaUploader from '../../components/ProjectMediaUploader.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import MediaPreview from '../../components/MediaPreview.jsx';

function SectionShell({ eyebrow, title, subtitle, children, className = '' }) {
  return (
    <section className={`border-b border-white/10 py-4 last:border-b-0 ${className}`.trim()}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-zinc-500">{eyebrow}</p>
          <h3 className="mt-1 text-base tracking-[0.08em] text-white md:text-lg">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-zinc-400">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function PrivateFileRow({ file, index, onUpdate, onRemove }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Title</p>
          <Input value={file.title || ''} onChange={(event) => onUpdate(index, { title: event.target.value })} />
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Kind</p>
          <Input value={file.kind || 'file'} onChange={(event) => onUpdate(index, { kind: event.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">URL</p>
          <Input value={file.url || ''} onChange={(event) => onUpdate(index, { url: event.target.value })} />
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 md:col-span-2">
          <input type="checkbox" checked={file.isPrivate !== false} onChange={(event) => onUpdate(index, { isPrivate: event.target.checked })} />
          <span>Private</span>
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="danger" onClick={() => onRemove(index)}>REMOVE</Button>
      </div>
    </div>
  );
}

export function ProjectBasicInfoSection({ draft, onUpdateDraft, onRefresh }) {
  return (
    <SectionShell eyebrow="BASIC INFO" title="Project Details" subtitle="基础信息和项目可见内容。">
      <div className="grid gap-3 md:grid-cols-2">
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
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
      </div>
    </SectionShell>
  );
}

export function ProjectMediaSection({ draft, uploading, uploadProgress, uploadStage, uploadStatus, uploadFailureStage, uploadTarget, onUpdateDraft, onUploadImage, onUploadVideo, onUploadBts, onRemoveBts, onUpdateBts, onMoveBtsUp, onMoveBtsDown, onReorderBts }) {
  return (
    <div className="grid gap-4">
      <SectionShell eyebrow="UPLOAD" title="Single Project Upload" subtitle="上传单个作品，自动识别图片或视频，并回填封面预览和 URL。">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:p-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Upload one work</p>
              <h4 className="mt-2 text-base tracking-[0.08em] text-white">从本地选择一个图片或视频</h4>
              <p className="mt-2 text-sm leading-7 text-zinc-400">上传后自动写入 URL，上传过程展示进度、阶段和失败节点。</p>
            </div>
            <div className="flex justify-start md:justify-end">
              <MediaPicker
                label="UPLOAD"
                accept="image/*,video/*"
                value={draft.coverUrl || draft.mainVideoUrl}
                uploading={uploading}
                progress={uploadProgress}
                stage={uploadStage}
                statusText={uploadStatus}
                failedStage={uploadFailureStage}
                helperText="单个作品上传"
                onPick={(file) => {
                  const kind = file?.type?.startsWith('video/') ? 'video' : 'image';
                  if (kind === 'video') {
                    onUploadVideo(file, { category: draft.category, displayName: draft.title });
                  } else {
                    onUploadImage(file, { category: draft.category, displayName: draft.title });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Title</p>
              <Input value={draft.title} onChange={(event) => onUpdateDraft({ title: event.target.value })} />
            </label>
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Category</p>
              <Input value={draft.category} onChange={(event) => onUpdateDraft({ category: event.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Description</p>
              <Textarea value={draft.description || ''} onChange={(event) => onUpdateDraft({ description: event.target.value })} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)] md:items-start">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Cover Preview</p>
              <div className="mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <MediaPreview src={draft.coverUrl || draft.mainVideoUrl} title={draft.title || 'Cover preview'} />
              </div>
            </div>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-200">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Current URL</p>
                <p className="mt-1 break-all text-zinc-300">{draft.coverUrl || draft.mainVideoUrl || 'Upload will fill the URL automatically.'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Current Type</p>
                <p className="mt-1 text-zinc-300">{String(draft.kind || draft.mediaType || 'image')}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Status</p>
                <p className="mt-1 text-zinc-300">{uploadStatus || 'Waiting for upload.'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-400">
                {uploadStage === 'error' ? 'Upload stopped at the failed node.' : 'Progress and failure stages are reused from existing upload flow.'}
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell eyebrow="UPLOAD" title="Batch Project Upload" subtitle="批量上传多个作品，逐个校对标题、类别和预览。">
        <ProjectMediaUploader
          items={Array.isArray(draft.btsMedia) ? draft.btsMedia : []}
          uploading={uploading}
          progress={uploadProgress}
          uploadStage={uploadStage}
          uploadStatus={uploadStatus}
          failedStage={uploadFailureStage}
          uploadTarget={uploadTarget}
          onUpload={(file, kind, meta) => onUploadBts(file, kind, { ...meta, category: draft.category, displayName: draft.title })}
          onRemove={onRemoveBts}
          onUpdate={onUpdateBts}
          onMoveUp={onMoveBtsUp}
          onMoveDown={onMoveBtsDown}
          onReorder={onReorderBts}
        />
      </SectionShell>
    </div>
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
          <PrivateFileRow key={`${file.url || 'private-file'}-${index}`} file={file} index={index} onUpdate={updateFile} onRemove={removeFile} />
        ))}
      </div>
    </SectionShell>
  );
}
