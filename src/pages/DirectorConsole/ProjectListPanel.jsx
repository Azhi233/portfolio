export default function ProjectListPanel({
  outlinedProjectsForList,
  workOutlineOptions,
  workOutlineFilter,
  onWorkOutlineFilterChange,
  groupedOutlinedProjects,
  getWorkOutlineTags,
  onOpenAdd,
  onOpenEdit,
  onDeleteProject,
  ProjectVideoPresence,
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 px-4 py-3">
        <p className="text-xs tracking-[0.12em] text-zinc-400">PROJECT LIST · {outlinedProjectsForList.length} ITEMS</p>
        <button
          type="button"
          onClick={onOpenAdd}
          className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-2 text-xs tracking-[0.12em] text-emerald-200"
        >
          + Add New Project
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
        {workOutlineOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onWorkOutlineFilterChange(option.id)}
            className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.14em] transition ${
              workOutlineFilter === option.id
                ? 'border-zinc-300/80 bg-zinc-100/10 text-zinc-100'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {groupedOutlinedProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
          NO PROJECTS IN THIS OUTLINE CATEGORY.
        </div>
      ) : (
        groupedOutlinedProjects.map((group) => (
          <div key={group.category} className="space-y-3">
            <p className="text-xs tracking-[0.16em] text-zinc-400">{group.category.toUpperCase()} · {group.items.length}</p>
            {group.items.map((project) => (
              <article key={project.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-100">{project.title}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{project.category} · ORDER #{project.sortOrder}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      OUTLINE: {getWorkOutlineTags(project).filter((tag) => tag !== 'all').join(' · ') || 'DEFAULT'}
                    </p>
                    {project._readonlyFromProjectData ? (
                      <p className="mt-1 text-[10px] tracking-[0.1em] text-amber-300">只读占位：来自 Project Modules，建议先迁移/新建项目到 Projects。</p>
                    ) : null}
                    <ProjectVideoPresence project={project} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenEdit(project)}
                      disabled={project._readonlyFromProjectData}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        project._readonlyFromProjectData
                          ? 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                          : 'border-zinc-600 bg-zinc-900 text-zinc-200'
                      }`}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(project.id)}
                      disabled={project._readonlyFromProjectData}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        project._readonlyFromProjectData
                          ? 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                          : 'border-rose-400/60 bg-rose-400/10 text-rose-200'
                      }`}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
