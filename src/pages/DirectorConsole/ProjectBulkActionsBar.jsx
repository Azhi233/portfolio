export default function ProjectBulkActionsBar({
  selectedIds,
  selectedOnPageCount,
  pagedProjects,
  filteredProjects,
  allFilteredSelected,
  showSelectedOnly,
  onToggleSelectCurrentPage,
  onToggleSelectAllFiltered,
  onToggleShowSelectedOnly,
  onBulkVisibility,
  onBulkPublishStatus,
  selectButtonBaseClass,
  selectButtonDefaultClass,
  selectButtonMutedClass,
  selectButtonDisabledClass,
  selectToggleActiveClass,
  selectToggleInactiveClass,
  bulkButtonBaseClass,
  bulkShowClass,
  bulkHideClass,
  bulkPublishClass,
  bulkDraftClass,
  bulkButtonDisabledClass,
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-700/60 bg-zinc-950/50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleSelectCurrentPage}
          className={`${selectButtonBaseClass} ${selectButtonDefaultClass}`}
        >
          {selectedOnPageCount === pagedProjects.length && pagedProjects.length > 0 ? 'UNSELECT PAGE' : 'SELECT PAGE'}
        </button>
        <button
          type="button"
          onClick={onToggleSelectAllFiltered}
          disabled={filteredProjects.length === 0}
          className={`${selectButtonBaseClass} ${
            filteredProjects.length > 0
              ? allFilteredSelected
                ? selectButtonMutedClass
                : selectButtonDefaultClass
              : selectButtonDisabledClass
          }`}
        >
          {allFilteredSelected ? 'UNSELECT FILTERED' : 'SELECT FILTERED'}
        </button>
        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={onToggleShowSelectedOnly}
          className={`${selectButtonBaseClass} ${
            selectedIds.length > 0
              ? showSelectedOnly
                ? selectToggleActiveClass
                : selectToggleInactiveClass
              : selectButtonDisabledClass
          }`}
        >
          {showSelectedOnly ? 'SHOW ALL' : 'SHOW SELECTED'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={selectedIds.length === 0} onClick={() => onBulkVisibility(true)} className={`${bulkButtonBaseClass} ${selectedIds.length > 0 ? bulkShowClass : bulkButtonDisabledClass}`}>BULK SHOW</button>
        <button type="button" disabled={selectedIds.length === 0} onClick={() => onBulkVisibility(false)} className={`${bulkButtonBaseClass} ${selectedIds.length > 0 ? bulkHideClass : bulkButtonDisabledClass}`}>BULK HIDE</button>
        <button type="button" disabled={selectedIds.length === 0} onClick={() => onBulkPublishStatus('Published')} className={`${bulkButtonBaseClass} ${selectedIds.length > 0 ? bulkPublishClass : bulkButtonDisabledClass}`}>BULK PUBLISH</button>
        <button type="button" disabled={selectedIds.length === 0} onClick={() => onBulkPublishStatus('Draft')} className={`${bulkButtonBaseClass} ${selectedIds.length > 0 ? bulkDraftClass : bulkButtonDisabledClass}`}>BULK DRAFT</button>
      </div>
    </div>
  );
}
