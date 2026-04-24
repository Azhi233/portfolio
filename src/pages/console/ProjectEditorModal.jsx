import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import { ProjectBasicInfoSection, ProjectFlagsSection, ProjectMediaSection, ProjectPrivateFilesSection, ProjectTypeSection } from './ProjectEditorSections.jsx';

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
        <div className="grid gap-6">
          <ProjectBasicInfoSection draft={draft} onUpdateDraft={onUpdateDraft} onRefresh={onRefresh} />
          <ProjectMediaSection
            draft={draft}
            uploading={uploading}
            uploadProgress={uploadProgress}
            uploadStage={uploadStage}
            uploadStatus={uploadStatus}
            uploadFailureStage={uploadFailureStage}
            uploadTarget={uploadTarget}
            onToggleDisplayOn={onToggleDisplayOn}
            onUploadImage={onUploadImage}
            onUploadVideo={onUploadVideo}
            onUploadBts={onUploadBts}
            onRemoveBts={onRemoveBts}
            onUpdateBts={onUpdateBts}
            onMoveBtsUp={onMoveBtsUp}
            onMoveBtsDown={onMoveBtsDown}
            onReorderBts={onReorderBts}
          />
          <ProjectTypeSection draft={draft} onUpdateDraft={onUpdateDraft} />
          <ProjectFlagsSection draft={draft} onUpdateDraft={onUpdateDraft} />
          <ProjectPrivateFilesSection draft={draft} onUpdateDraft={onUpdateDraft} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
        <Button type="button" variant="subtle" onClick={onClose}>CANCEL</Button>
        <Button type="button" variant="primary" onClick={onSave}>{saving ? 'SAVING...' : 'SAVE PROJECT'}</Button>
      </div>
    </Modal>
  );
}
