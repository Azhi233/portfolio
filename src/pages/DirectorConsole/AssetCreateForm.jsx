export default function AssetCreateForm({
  assetForm,
  assetFormError,
  assetUrlWarning,
  editingAssetId,
  formInputClass,
  formTextareaClass,
  moduleSlotOptions,
  getPublishTargetHint,
  inferMediaGroup,
  getAssetUrlWarning,
  onAssetFormChange,
  onAssetFormErrorChange,
  onAssetUrlWarningChange,
  onReset,
  onSubmit,
}) {
  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4 md:grid-cols-2">
      <label className="block">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Title</p>
        <input
          value={assetForm.title}
          onChange={(event) => {
            onAssetFormChange((prev) => ({ ...prev, title: event.target.value }));
            if (assetFormError) onAssetFormErrorChange('');
          }}
          className={formInputClass}
          placeholder="Asset title"
        />
      </label>

      <label className="block">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Type</p>
        <select
          value={assetForm.type}
          onChange={(event) => {
            const nextType = event.target.value;
            onAssetFormChange((prev) => ({ ...prev, type: nextType, mediaGroup: inferMediaGroup(nextType, prev.url) }));
            onAssetUrlWarningChange(nextType === 'video' || nextType === 'image' ? getAssetUrlWarning(assetForm.url, nextType) : '');
          }}
          className={formInputClass}
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="image-comparison">Image Comparison</option>
        </select>
      </label>

      {assetForm.type !== 'image-comparison' ? (
        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset URL (Local Link)</p>
          <input
            value={assetForm.url}
            onChange={(event) => {
              const nextUrl = event.target.value;
              onAssetFormChange((prev) => ({ ...prev, url: nextUrl }));
              onAssetUrlWarningChange(getAssetUrlWarning(nextUrl, assetForm.type));
              if (assetFormError) onAssetFormErrorChange('');
            }}
            className={formInputClass}
            placeholder="https://..."
          />
        </label>
      ) : (
        <div className="block md:col-span-2 rounded-md border border-zinc-700/60 bg-zinc-900/40 p-3">
          <p className="mb-3 text-xs tracking-[0.12em] text-zinc-400">Variants URLs (for comparison)</p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">RAW URL</p>
              <input
                value={assetForm.rawUrl}
                onChange={(event) => onAssetFormChange((prev) => ({ ...prev, rawUrl: event.target.value }))}
                className={formInputClass}
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">GRADED URL</p>
              <input
                value={assetForm.gradedUrl}
                onChange={(event) => onAssetFormChange((prev) => ({ ...prev, gradedUrl: event.target.value }))}
                className={formInputClass}
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">STYLED URL</p>
              <input
                value={assetForm.styledUrl}
                onChange={(event) => onAssetFormChange((prev) => ({ ...prev, styledUrl: event.target.value }))}
                className={formInputClass}
                placeholder="https://..."
              />
            </label>
          </div>
        </div>
      )}

      <label className="block">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Publish Target</p>
        <select
          value={assetForm.publishTarget}
          onChange={(event) => onAssetFormChange((prev) => ({ ...prev, publishTarget: event.target.value }))}
          className={formInputClass}
        >
          <option value="expertise">Expertise Only · 仅后台展示</option>
          <option value="project">Project Only · 仅项目页展示</option>
          <option value="both">Both · 同步到项目页 + 视频页</option>
        </select>
        <p className="mt-2 text-[11px] leading-5 tracking-[0.08em] text-zinc-500">
          选择 <span className="text-zinc-300">Both</span> 时，视频会同步进入商业项目页与视频页；未勾选的模块不会重复渲染。
        </p>
        <p className="mt-1 text-[11px] leading-5 tracking-[0.08em] text-zinc-600">当前选择：{getPublishTargetHint(assetForm.publishTarget)}</p>
      </label>

      {(assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both') ? (
        <>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Expertise Category</p>
            <select
              value={assetForm.expertiseCategory}
              onChange={(event) => onAssetFormChange((prev) => ({ ...prev, expertiseCategory: event.target.value }))}
              className={formInputClass}
            >
              <option value="commercial">commercial</option>
              <option value="industrial">industrial</option>
              <option value="events">events</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">技术向说明</p>
            <textarea
              value={assetForm.expertiseDescription}
              onChange={(event) => onAssetFormChange((prev) => ({ ...prev, expertiseDescription: event.target.value }))}
              className={formTextareaClass}
            />
          </label>
        </>
      ) : null}

      {(assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both') ? (
        <>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Project</p>
            <select
              value={assetForm.projectId}
              onChange={(event) => onAssetFormChange((prev) => ({ ...prev, projectId: event.target.value }))}
              className={formInputClass}
            >
              <option value="toy_project">toy_project</option>
              <option value="industry_project">industry_project</option>
            </select>
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">模块位（可选）</p>
            <select
              value={assetForm.moduleSlot}
              onChange={(event) => onAssetFormChange((prev) => ({ ...prev, moduleSlot: event.target.value }))}
              className={formInputClass}
            >
              {moduleSlotOptions.map((item) => (
                <option key={item.value || 'auto'} value={item.value}>{item.label}</option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-5 tracking-[0.08em] text-zinc-500">
              仅当需要固定到某个模块位时再选择；留空则按页面规则自动分配，避免素材在未选择区域重复出现。
            </p>
          </label>
          <label className="block md:col-span-2">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">商业向说明</p>
            <textarea
              value={assetForm.projectDescription}
              onChange={(event) => onAssetFormChange((prev) => ({ ...prev, projectDescription: event.target.value }))}
              className={formTextareaClass}
            />
          </label>
        </>
      ) : null}

      {assetUrlWarning ? (
        <p className="md:col-span-2 rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-xs tracking-[0.1em] text-amber-100">
          {assetUrlWarning}
        </p>
      ) : null}

      {assetFormError ? (
        <p className="md:col-span-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">
          {assetFormError}
        </p>
      ) : null}

      <div className="md:col-span-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300"
        >
          RESET
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200"
        >
          {editingAssetId ? 'UPDATE ASSET' : 'ADD ASSET'}
        </button>
      </div>
    </div>
  );
}
