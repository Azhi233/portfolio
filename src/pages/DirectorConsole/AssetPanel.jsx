export default function AssetPanel({
  assets,
  assetFilterMode,
  onAssetFilterModeChange,
  bulkAssetInput,
  onBulkAssetInputChange,
  bulkAssetError,
  onBulkAssetParse,
  onBulkAssetCreate,
  bulkAssetPreviewCount,
  bulkAssetSelectedCount,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">ASSETS CMS · VIEW DISTRIBUTION</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">仅保存 URL 字符串，按双视角分发到 Expertise / Project 页面</p>
          <p className="mt-2 text-[11px] tracking-[0.12em] text-zinc-500">TOTAL {assets.length}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `ALL (${assets.length})` },
            { id: 'expertise_only', label: 'EXPERTISE ONLY' },
            { id: 'project_only', label: 'PROJECT ONLY' },
            { id: 'both', label: 'BOTH' },
          ].map((m) => (
            <button key={m.id} type="button" aria-pressed={assetFilterMode === m.id} onClick={() => onAssetFilterModeChange(m.id)} className="rounded-full border px-3 py-1 text-[10px] tracking-[0.14em] transition border-zinc-700 bg-zinc-900/70 text-zinc-400">
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
        <p className="text-xs tracking-[0.16em] text-zinc-300">BULK URL PARSER</p>
        <textarea value={bulkAssetInput} onChange={(e) => onBulkAssetInputChange(e.target.value)} className="mt-3 min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200" />
        {bulkAssetError ? <p className="mt-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">{bulkAssetError}</p> : null}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-[11px] tracking-[0.1em] text-zinc-500">预览条数：{bulkAssetPreviewCount}</div>
          <div className="text-[11px] tracking-[0.1em] text-zinc-500">已选：{bulkAssetSelectedCount}</div>
          <div className="flex gap-2">
            <button type="button" onClick={onBulkAssetParse} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.12em] text-zinc-200">PARSE URLS</button>
            <button type="button" onClick={onBulkAssetCreate} className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-1.5 text-xs tracking-[0.12em] text-emerald-200">BULK CREATE</button>
          </div>
        </div>
      </div>
    </section>
  );
}
