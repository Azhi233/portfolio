export function useProjectSelectionActions({ selectedIds, setSelectedIds, pagedProjects, filteredProjects, allFilteredSelected, updateProject, projects, runProjectPreflight }) {
  const toggleSelectProject = (projectId) => {
    setSelectedIds((prev) => (prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]));
  };

  const toggleSelectCurrentPage = () => {
    const pageIds = pagedProjects.map((project) => project.id);
    if (pageIds.length === 0) return;

    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }
      return [...new Set([...prev, ...pageIds])];
    });
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredProjects.map((project) => project.id);
    if (filteredIds.length === 0) return;

    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      return [...new Set([...prev, ...filteredIds])];
    });
  };

  const applyBulkVisibility = (isVisible) => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      isVisible
        ? `Confirm show ${selectedIds.length} selected project(s)?`
        : `Confirm hide ${selectedIds.length} selected project(s)?`,
    );
    if (!confirmed) return;

    selectedIds.forEach((id) => updateProject(id, { isVisible }));
    setSelectedIds([]);
  };

  const applyBulkPublishStatus = (publishStatus) => {
    if (selectedIds.length === 0) return;

    if (publishStatus === 'Published') {
      const selectedProjects = projects.filter((project) => selectedIds.includes(project.id));
      const check = runProjectPreflight(selectedProjects);
      if (check.errorCount > 0) {
        const preview = check.issues
          .filter((x) => x.severity === 'error')
          .slice(0, 5)
          .map((x) => `- [${x.projectTitle}] ${x.message}`)
          .join('\n');

        const forcePublish = window.confirm(
          `Preflight found ${check.errorCount} error(s).\n\n${preview}\n\nStill continue publishing selected items?`,
        );
        if (!forcePublish) return;
      }
    }

    const label = publishStatus === 'Published' ? 'publish' : 'move to draft';
    const confirmed = window.confirm(`Confirm ${label} ${selectedIds.length} selected project(s)?`);
    if (!confirmed) return;

    selectedIds.forEach((id) => updateProject(id, { publishStatus }));
    setSelectedIds([]);
  };

  return {
    toggleSelectProject,
    toggleSelectCurrentPage,
    toggleSelectAllFiltered,
    applyBulkVisibility,
    applyBulkPublishStatus,
  };
}
