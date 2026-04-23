import ProjectEditorModal from './ProjectEditorModal.jsx';
import ProjectsOverviewSection from './ProjectsOverviewSection.jsx';
import { useProjectsPanel } from './useProjectsPanel.js';

function ProjectsPanel({ filterMode = 'all' }) {
  const { state, featuredVideos, liveCount, filtered, load, openNew, openEdit, toggleDisplayOn, updateFeaturedOrder, save, uploadAsset, addBtsItem, updateBtsMedia, remove, toggleFeatured, setState, updateDraft } = useProjectsPanel(filterMode);

  return (
    <>
      <ProjectsOverviewSection
        liveCount={liveCount}
        featuredVideos={featuredVideos}
        onRefresh={load}
        onUpload={openNew}
        query={state.query}
        category={state.category}
        onQueryChange={(value) => setState((prev) => ({ ...prev, query: value }))}
        onCategoryChange={(value) => setState((prev) => ({ ...prev, category: value }))}
        loading={state.loading}
        notice={state.notice}
        noticeTone={state.noticeTone}
        error={state.error}
        deleting={state.deleting}
        deleteStatus={state.deleteStatus}
        filtered={filtered}
        onEdit={openEdit}
        onToggleFeatured={toggleFeatured}
        onDelete={remove}
        onReorderFeatured={updateFeaturedOrder}
      />

      <ProjectEditorModal
        open={state.isOpen}
        mode={state.mode}
        draft={state.draft}
        saving={state.saving}
        loading={state.loading}
        uploading={state.uploading}
        uploadProgress={state.uploadProgress}
        uploadStage={state.uploadStage}
        uploadStatus={state.uploadStatus}
        uploadFailureStage={state.uploadFailureStage}
        uploadTarget={state.uploadTarget}
        onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}
        onRefresh={load}
        onSave={save}
        onUpdateDraft={updateDraft}
        onToggleDisplayOn={toggleDisplayOn}
        onUploadImage={(file) => uploadAsset(file, 'image')}
        onUploadVideo={(file) => uploadAsset(file, 'video')}
        onUploadBts={(file, kind, meta) => addBtsItem(file, kind, meta)}
        onRemoveBts={(index) => updateBtsMedia((Array.isArray(state.draft.btsMedia) ? state.draft.btsMedia : []).filter((_, i) => i !== index))}
        onUpdateBts={(index, nextItem) => updateBtsMedia((Array.isArray(state.draft.btsMedia) ? state.draft.btsMedia : []).map((item, i) => (i === index ? nextItem : item)))}
        onMoveBtsUp={(index) => {
          const items = Array.isArray(state.draft.btsMedia) ? [...state.draft.btsMedia] : [];
          if (index <= 0) return;
          [items[index - 1], items[index]] = [items[index], items[index - 1]];
          updateBtsMedia(items);
        }}
        onMoveBtsDown={(index) => {
          const items = Array.isArray(state.draft.btsMedia) ? [...state.draft.btsMedia] : [];
          if (index >= items.length - 1) return;
          [items[index + 1], items[index]] = [items[index], items[index + 1]];
          updateBtsMedia(items);
        }}
        onReorderBts={(from, to) => {
          const items = Array.isArray(state.draft.btsMedia) ? [...state.draft.btsMedia] : [];
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          updateBtsMedia(items);
        }}
      />
    </>
  );
}

export default ProjectsPanel;
