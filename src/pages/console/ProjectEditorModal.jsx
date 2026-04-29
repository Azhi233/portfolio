import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import { ProjectBasicInfoSection, ProjectMediaSection } from './ProjectEditorSections.jsx';

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
  onToggleDisplayOn,
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
      <div className="max-h-[80vh] overflow-y-auto pr-1">
        <div className="mb-5 border-b border-white/10 pb-4">
          <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Project Editor</p>
          <h3 className="mt-2 text-lg tracking-[0.08em] text-white">Project title, category, description and media.</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">只保留项目基础信息与作品上传，不显示私密项目、展示开关等无关模块。</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]">
          <div>
            <ProjectBasicInfoSection draft={draft} onUpdateDraft={onUpdateDraft} onRefresh={onRefresh} />
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
          </div>

          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:p-6">
              <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">TYPE</p>
              <h3 className="mt-2 text-base tracking-[0.08em] text-white">Content type</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-400">自动识别图片或视频，只保留当前作品必要的展示预览。</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
        <Button type="button" variant="subtle" onClick={onClose}>CANCEL</Button>
        <Button type="button" variant="primary" onClick={onSave}>{saving ? 'SAVING...' : 'SAVE PROJECT'}</Button>
      </div>
    </Modal>
  );
}
