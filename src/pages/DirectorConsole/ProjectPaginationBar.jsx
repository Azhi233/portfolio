export default function ProjectPaginationBar({
  currentPage,
  totalPages,
  displayProjects,
  selectedInFilteredCount,
  onPrev,
  onNext,
  pageButtonBaseClass,
  pageButtonEnabledClass,
  pageButtonDisabledClass,
}) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <p className="text-xs tracking-[0.12em] text-zinc-500">
        PAGE {currentPage} / {totalPages} · MATCHES {displayProjects.length} · SELECTED {selectedInFilteredCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={onPrev}
          className={`${pageButtonBaseClass} ${currentPage > 1 ? pageButtonEnabledClass : pageButtonDisabledClass}`}
        >
          PREV
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={onNext}
          className={`${pageButtonBaseClass} ${currentPage < totalPages ? pageButtonEnabledClass : pageButtonDisabledClass}`}
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
