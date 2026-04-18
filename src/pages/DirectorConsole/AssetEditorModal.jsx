export default function AssetEditorModal({
  open,
  assetForm,
  assetFormError,
  moduleSlotOptions,
  formInputClass,
  getPublishTargetHint,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-700/70 bg-zinc-900/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭素材编辑"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-zinc-300 transition hover:border-zinc-400 hover:text-zinc-100"
        >
          ×
        </button>

        <h3 className="text-sm tracking-[0.16em] text-zinc-100">EDIT ASSET</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Title</p>
            <input value={assetForm.title} onChange={(e) => onChange('title', e.target.value)} className={formInputClass} />
          </label>

          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Type</p>
            <select value={assetForm.type} onChange={(e) => onChange('type', e.target.value)} className={formInputClass}>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="image-comparison">Image Comparison</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset URL</p>
            <input value={assetForm.url} onChange={(e) => onChange('url', e.target.value)} className={formInputClass} />
          </label>

          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Publish Target</p>
            <select value={assetForm.publishTarget} onChange={(e) => onChange('publishTarget', e.target.value)} className={formInputClass}>
              <option value="expertise">Expertise Only · 仅后台展示</option>
              <option value="project">Project Only · 仅项目页展示</option>
              <option value="both">Both · 同步到项目页 + 视频页</option>
            </select>
            <p className="mt-2 text-[11px] leading-5 tracking-[0.08em] text-zinc-500">
              选择 <span className="text-zinc-300">Both</span> 时，视频会同步进入商业项目页与视频页；未勾选的模块不会重复渲染。
            </p>
            <p className="mt-1 text-[11px] leading-5 tracking-[0.08em] text-zinc-600">当前选择：{getPublishTargetHint(assetForm.publishTarget)}</p>
          </label>

          {(assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both') ? (
            <>
              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Project</p>
                <select value={assetForm.projectId} onChange={(e) => onChange('projectId', e.target.value)} className={formInputClass}>
                  <option value="toy_project">toy_project</option>
                  <option value="industry_project">industry_project</option>
                </select>
              </label>

              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">模块位（可选）</p>
                <select value={assetForm.moduleSlot} onChange={(e) => onChange('moduleSlot', e.target.value)} className={formInputClass}>
                  {moduleSlotOptions.map((item) => (
                    <option key={item.value || 'auto'} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {assetFormError ? (
            <p className="md:col-span-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">{assetFormError}</p>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300">CANCEL</button>
          <button type="button" onClick={onSubmit} className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200">UPDATE ASSET</button>
        </div>
      </div>
    </div>
  );
}
