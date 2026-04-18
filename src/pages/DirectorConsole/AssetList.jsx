export default function AssetList({
  filteredAssetsForPanel,
  getAssetDistributionSummary,
  getAssetUrlWarning,
  onEditAsset,
  onDeleteAsset,
}) {
  return (
    <div className="mt-4 grid gap-3">
      {filteredAssetsForPanel.map((asset) => (
        <article key={asset.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-zinc-100">{asset.title}</p>
              <p className="text-[11px] text-zinc-500">{asset.url}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] tracking-[0.12em] text-zinc-400">
                {getAssetDistributionSummary(asset)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onEditAsset(asset, getAssetUrlWarning(asset.url, asset.type));
                  }}
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200"
                >
                  EDIT
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteAsset(asset.id)}
                  className="rounded-md border border-rose-400/60 px-3 py-1.5 text-xs text-rose-200"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}

      {filteredAssetsForPanel.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
          NO ASSETS IN THIS FILTER MODE.
        </div>
      ) : null}
    </div>
  );
}
