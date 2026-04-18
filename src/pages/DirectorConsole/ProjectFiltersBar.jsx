export default function ProjectFiltersBar({
  categoryFilter,
  statusFilter,
  searchQuery,
  hasActiveFilters,
  onCategoryFilterChange,
  onStatusFilterChange,
  onSearchQueryChange,
  onResetFilters,
  filterInputClass,
  filterCategories,
  filterStatuses,
  getActionButtonClass,
}) {
  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3 md:grid-cols-[200px_200px_1fr_auto] md:items-end">
      <label className="block">
        <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">FILTER BY CATEGORY</p>
        <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)} className={filterInputClass}>
          {filterCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">FILTER BY STATUS</p>
        <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className={filterInputClass}>
          {filterStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">SEARCH TITLE</p>
        <input value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} className={filterInputClass} placeholder="Search project title..." />
      </label>

      <button type="button" disabled={!hasActiveFilters} onClick={onResetFilters} className={getActionButtonClass(hasActiveFilters)}>
        RESET FILTERS
      </button>
    </div>
  );
}
