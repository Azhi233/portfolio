export default function MediaWorksPanel({
  title,
  description,
  items,
  emptyText,
  gridClassName,
  getAssetDistributionSummary,
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">{title}</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">{description}</p>
        </div>
      </div>
      <div className={gridClassName}>
        {items.map((asset) => (
          <article key={asset.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
            <p className="text-sm text-zinc-100">{asset.title}</p>
            <p className="mt-1 break-all text-[11px] text-zinc-500">{asset.url}</p>
            <p className="mt-2 text-[11px] tracking-[0.12em] text-cyan-300">{getAssetDistributionSummary(asset)}</p>
          </article>
        ))}
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
            {emptyText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
