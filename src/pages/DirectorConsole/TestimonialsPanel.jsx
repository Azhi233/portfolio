export default function TestimonialsPanel({
  reviews,
  setReviewStatus,
  updateReview,
  handleExportReviewAuditLogs,
  reviewAuditLogs,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">TESTIMONIALS MODERATION</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">审核客户提交评价并可修改文案。</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {(reviews || []).map((item) => (
          <article key={item.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-100">{item.projectName}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {item.clientName}
                  {item.authorType === 'company' && item.companyName
                    ? ` · ${item.companyName}${item.position ? ` / ${item.position}` : ''}`
                    : ''}
                  {item.isAnonymous ? ' · 匿名' : ''}
                </p>
                <p className="mt-2 text-[11px] tracking-[0.12em] text-zinc-500">STATUS: {String(item.status || 'pending').toUpperCase()}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus(item.id, 'approved', 'director-console')}
                  className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200"
                >
                  APPROVE
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus(item.id, 'pending', 'director-console')}
                  className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200"
                >
                  PENDING
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus(item.id, 'rejected', 'director-console')}
                  className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200"
                >
                  REJECT
                </button>
              </div>
            </div>

            <textarea
              value={item.content || ''}
              onChange={(event) => updateReview(item.id, { content: event.target.value })}
              className="mt-3 min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />

            <div className="mt-3 flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={Boolean(item.isFeatured)}
                  onChange={(event) => updateReview(item.id, { isFeatured: event.target.checked })}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400"
                />
                FEATURED
              </label>

              <input
                value={item.clientName || ''}
                onChange={(event) => updateReview(item.id, { clientName: event.target.value })}
                className="w-56 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200"
                placeholder="Client display name"
              />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs tracking-[0.16em] text-zinc-300">AUDIT LOGS</p>
          <button
            type="button"
            onClick={handleExportReviewAuditLogs}
            className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-3 py-1.5 text-xs tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-300/20"
          >
            EXPORT CSV
          </button>
        </div>
        <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
          {(reviewAuditLogs || []).length === 0 ? (
            <p className="text-xs tracking-[0.12em] text-zinc-500">暂无审核操作日志。</p>
          ) : (
            reviewAuditLogs.map((log) => (
              <div key={log.id} className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">
                <p className="tracking-[0.1em] text-zinc-400">{new Date(log.at).toLocaleString()}</p>
                <p className="mt-1">
                  {log.operator || 'unknown'} changed status {String(log.from || '').toUpperCase()} → {String(log.to || '').toUpperCase()}
                </p>
                <p className="mt-1 text-zinc-500">{log.projectName} · {log.clientName}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
