export default function ProjectGrid({
  pagedProjects,
  projectViewMode,
  selectedIds,
  onToggleSelectProject,
  onMoveProject,
  onHandleQuickPrivatePassword,
  onHandleCopyPrivateLink,
  onHandleOpenEdit,
  onDeleteProject,
}) {
  return (
    <div className={`mt-5 grid gap-4 ${projectViewMode === 'card' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
      {pagedProjects.map((project) => (
        <article
          key={project.id}
          className={`overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-950/70 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${
            projectViewMode === 'list' ? 'p-4' : ''
          }`}
        >
          {projectViewMode === 'card' ? (
            <>
              <div className="h-36 w-full bg-zinc-900">
                {project.coverUrl ? (
                  <img src={project.coverUrl} alt={project.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-zinc-500">NO COVER IMAGE</div>
                )}
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(project.id)}
                      onChange={() => onToggleSelectProject(project.id)}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400"
                    />
                    <h3 className="text-sm tracking-[0.08em] text-zinc-100">{project.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    {project.publishStatus === 'Private' ? (
                      <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">PRIVATE</span>
                    ) : project.publishStatus === 'Draft' ? (
                      <span className="rounded-full border border-purple-300/70 bg-purple-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-purple-200">DRAFT</span>
                    ) : (
                      <span className="rounded-full border border-sky-300/70 bg-sky-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-sky-200">PUBLISHED</span>
                    )}
                    {project.isFeatured && <span className="rounded-full border border-emerald-300/70 bg-emerald-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-emerald-200">FEATURED</span>}
                    {!project.isVisible && <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">HIDDEN</span>}
                  </div>
                </div>

                <p className="text-xs tracking-[0.12em] text-zinc-400">{project.category}</p>
                <p className="text-[11px] tracking-[0.12em] text-zinc-500">ORDER #{project.sortOrder}</p>
                {project.clientCode ? <p className="text-[11px] tracking-[0.12em] text-cyan-300">CODE: {project.clientCode}</p> : null}

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => onMoveProject(project.id, 'up')} className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400">↑</button>
                  <button type="button" onClick={() => onMoveProject(project.id, 'down')} className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400">↓</button>
                  <button type="button" onClick={() => onHandleQuickPrivatePassword(project)} title={project.publishStatus === 'Private' ? '取消私密（改为 Published）' : '设为私密并设置密码'} className={`rounded-md border px-3 py-1.5 text-xs tracking-[0.1em] transition ${project.publishStatus === 'Private' ? 'border-amber-300/70 bg-amber-300/15 text-amber-200 hover:bg-amber-300/25' : 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400'}`}>{project.publishStatus === 'Private' ? '🔒' : '🔓'}</button>
                  {project.publishStatus === 'Private' ? <button type="button" onClick={() => onHandleCopyPrivateLink(project)} className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-3 py-1.5 text-xs tracking-[0.1em] text-cyan-200 transition hover:bg-cyan-300/20">Copy Private Link</button> : null}
                  <button type="button" onClick={() => onHandleOpenEdit(project)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400">EDIT</button>
                  <button type="button" onClick={() => onDeleteProject(project.id)} className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs tracking-[0.08em] text-rose-200 transition hover:bg-rose-400/20">DELETE</button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => onToggleSelectProject(project.id)} className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400" />
                  <div>
                    <h3 className="text-sm tracking-[0.08em] text-zinc-100">{project.title}</h3>
                    <p className="text-xs tracking-[0.12em] text-zinc-400">{project.category} · ORDER #{project.sortOrder}</p>
                    {project.clientCode ? <p className="mt-1 text-[11px] tracking-[0.12em] text-cyan-300">CODE: {project.clientCode}</p> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onMoveProject(project.id, 'up')} className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400">↑</button>
                  <button type="button" onClick={() => onMoveProject(project.id, 'down')} className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400">↓</button>
                  <button type="button" onClick={() => onHandleQuickPrivatePassword(project)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.1em] text-zinc-200 transition hover:border-zinc-400">{project.publishStatus === 'Private' ? '🔒' : '🔓'}</button>
                  {project.publishStatus === 'Private' ? <button type="button" onClick={() => onHandleCopyPrivateLink(project)} className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-3 py-1.5 text-xs tracking-[0.1em] text-cyan-200 transition hover:bg-cyan-300/20">Copy Private Link</button> : null}
                  <button type="button" onClick={() => onHandleOpenEdit(project)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400">EDIT</button>
                  <button type="button" onClick={() => onDeleteProject(project.id)} className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs tracking-[0.08em] text-rose-200 transition hover:bg-rose-400/20">DELETE</button>
                </div>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
