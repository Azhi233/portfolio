import { useMemo } from 'react';

export function useProjectPaginationDerived({ displayProjects, currentPage, itemsPerPage, selectedIds, filteredProjects }) {
  const totalPages = useMemo(() => Math.max(1, Math.ceil(displayProjects.length / itemsPerPage)), [displayProjects.length, itemsPerPage]);
  const selectedOnPageCount = useMemo(
    () => displayProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).filter((project) => selectedIds.includes(project.id)).length,
    [currentPage, displayProjects, itemsPerPage, selectedIds],
  );
  const allFilteredSelected = useMemo(
    () => filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.includes(project.id)),
    [filteredProjects, selectedIds],
  );

  return {
    totalPages,
    selectedOnPageCount,
    allFilteredSelected,
  };
}
