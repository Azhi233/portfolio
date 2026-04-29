import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import MediaPreview from '../../components/MediaPreview.jsx';
import { ProjectMediaSection } from './ProjectEditorSections.jsx';

export default function ProjectEditorModal({
  open,
  mode,
  draft,
  saving,
  loading,
  uploading,
  uploadProgress,
  uploadStage,
  uploadStatus,
  uploadFailureStage,
  uploadTarget,
  onClose,
  onRefresh,
  onSave,
  onUpdateDraft,
  onUploadImage,
  onUploadVideo,
  onUploadBts,
  onRemoveBts,
  onUpdateBts,
  onMoveBtsUp,
  onMoveBtsDown,
  onReorderBts,
}) {
  return (
    <Modal open={open} title={mode === 'edit' ? 'Edit Project' : 'Create Project'} onClose={onClose}>
      <div className="grid min-h-0 gap-4 lg:grid-rows-[auto,1fr,auto]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">PROJECT UPLOAD</p>
            <h3 className="mt-2 text-lg tracking-[0.08em] text-white">Upload media and review output.</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">保留最核心的上传与预览，屏幕足够大时一页展示，空间不足时由外层弹窗接管滚动。</p>
          </div>
          <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
        </div>

        <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
          <ProjectMediaSection
            draft={draft}
            uploading={uploading}
            uploadProgress={uploadProgress}
            uploadStage={uploadStage}
            uploadStatus={uploadStatus}
            uploadFailureStage={uploadFailureStage}
            uploadTarget={uploadTarget}
            onUpdateDraft={onUpdateDraft}
            onUploadImage={onUploadImage}
            onUploadVideo={onUploadVideo}
            onUploadBts={onUploadBts}
            onRemoveBts={onRemoveBts}
            onUpdateBts={onUpdateBts}
            onMoveBtsUp={onMoveBtsUp}
            onMoveBtsDown={onMoveBtsDown}
            onReorderBts={onReorderBts}
          />

          <div className="grid min-h-0 gap-4 self-start rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">PREVIEW</p>
                <h3 className="mt-2 text-base tracking-[0.08em] text-white">Current output</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] tracking-[0.14em] text-zinc-300">LIVE</span>
            </div>
            <p className="text-sm leading-6 text-zinc-400">自动识别图片或视频，只保留当前作品必要的展示预览。</p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <MediaPreview src={draft.coverUrl || draft.mainVideoUrl} title={draft.title || 'Cover preview'} />
            </div>
            <div className="grid gap-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Current URL</p>
                <p className="mt-1 break-all">{draft.coverUrl || draft.mainVideoUrl || 'Upload will fill the URL automatically.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Current Type</p>
                <p className="mt-1">{String(draft.kind || draft.mediaType || 'image')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-3">
          <Button type="button" variant="subtle" onClick={onClose}>CANCEL</Button>
          <Button type="button" variant="primary" onClick={onSave}>{saving ? 'SAVING...' : 'SAVE PROJECT'}</Button>
        </div>
      </div>
    </Modal>
  );
}
