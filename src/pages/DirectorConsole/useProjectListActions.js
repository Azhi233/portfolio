export function useProjectListActions({ selectedIds, setSelectedIds, sortedProjects, pagedProjects, filteredProjects, allFilteredSelected, projects, updateProject }) {
  const moveProject = (projectId, direction) => {
    const currentIndex = sortedProjects.findIndex((project) => project.id === projectId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedProjects.length) return;

    const reordered = [...sortedProjects];
    const [picked] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, picked);

    reordered.forEach((project, index) => {
      if (project.sortOrder !== index) {
        updateProject(project.id, { sortOrder: index });
      }
    });
  };

  return {
    moveProject,
  };
}
