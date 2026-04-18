export function moveProjectByDirection({
  projectId,
  direction,
  sortedProjects,
  updateProject,
}) {
  const index = sortedProjects.findIndex((project) => project.id === projectId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= sortedProjects.length) {
    return;
  }

  const current = sortedProjects[index];
  const target = sortedProjects[targetIndex];
  updateProject(current.id, { sortOrder: target.sortOrder });
  updateProject(target.id, { sortOrder: current.sortOrder });
}

export function toggleProjectSelection({ projectId, selectedProjectIds, setSelectedProjectIds }) {
  setSelectedProjectIds((prev) =>
    prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
  );
}

export function toggleCurrentPageSelection({
  pagedProjects,
  selectedProjectIds,
  setSelectedProjectIds,
}) {
  const pageIds = pagedProjects.map((project) => project.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedProjectIds.includes(id));

  setSelectedProjectIds((prev) => {
    if (allSelected) {
      return prev.filter((id) => !pageIds.includes(id));
    }
    return [...new Set([...prev, ...pageIds])];
  });
}

export function toggleAllFilteredSelection({
  filteredProjects,
  allFilteredSelected,
  setSelectedProjectIds,
}) {
  const filteredIds = filteredProjects.map((project) => project.id);
  setSelectedProjectIds((prev) =>
    allFilteredSelected ? prev.filter((id) => !filteredIds.includes(id)) : [...new Set([...prev, ...filteredIds])],
  );
}

export function applyBulkVisibilityChange({
  selectedProjectIds,
  updateProject,
  isVisible,
  setSelectedProjectIds,
}) {
  if (selectedProjectIds.length === 0) return;
  selectedProjectIds.forEach((projectId) => updateProject(projectId, { isVisible }));
  setSelectedProjectIds([]);
}

export function applyBulkPublishStatusChange({
  selectedProjectIds,
  updateProject,
  publishStatus,
  setSelectedProjectIds,
}) {
  if (selectedProjectIds.length === 0) return;
  selectedProjectIds.forEach((projectId) =>
    updateProject(projectId, {
      status: publishStatus === 'published' ? 'Published' : publishStatus === 'private' ? 'Private' : 'Draft',
      isPublished: publishStatus === 'published',
      isPrivate: publishStatus === 'private',
    }),
  );
  setSelectedProjectIds([]);
}
