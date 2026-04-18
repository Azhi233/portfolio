import { useMemo, useState } from 'react';

export function useDirectorProjectsState({ projects, projectData, runProjectPreflight }) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [projectViewMode, setProjectViewMode] = useState('card');
  const [privateFilterMode, setPrivateFilterMode] = useState('all');
  const [workOutlineFilter, setWorkOutlineFilter] = useState('all');
  const [preflightResult, setPreflightResult] = useState(() => runProjectPreflight(projects));

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [projects],
  );

  const baseProjectsForList = useMemo(() => {
    if (sortedProjects.length > 0) return sortedProjects;

    return Object.values(projectData || {})
      .filter((item) => item && typeof item === 'object')
      .map((item, index) => ({
        id: String(item.id || `project-data-${index}`),
        title: String(item.title || `Project ${index + 1}`),
        category: item.id === 'toy_project' ? 'Toys' : item.id === 'industry_project' ? 'Industrial' : 'Misc',
        sortOrder: index,
        _readonlyFromProjectData: true,
      }));
  }, [sortedProjects, projectData]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortedProjects.filter((project) => {
      const matchesCategory = categoryFilter === 'All' || project.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
      const matchesSearch = !query || String(project.title || '').toLowerCase().includes(query);
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [sortedProjects, categoryFilter, statusFilter, searchQuery]);

  const displayProjects = useMemo(() => {
    return showSelectedOnly ? filteredProjects.filter((project) => selectedIds.includes(project.id)) : filteredProjects;
  }, [filteredProjects, selectedIds, showSelectedOnly]);

  const outlinedProjectsForList = useMemo(() => {
    return baseProjectsForList.filter((project) => {
      if (workOutlineFilter === 'all') return true;
      const saved = Array.isArray(project?.outlineTags) ? project.outlineTags : [];
      return saved.includes(workOutlineFilter);
    });
  }, [baseProjectsForList, workOutlineFilter]);

  const groupedOutlinedProjects = useMemo(() => {
    const groups = new Map();
    outlinedProjectsForList.forEach((project) => {
      const category = String(project.category || 'Misc');
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(project);
    });
    return [...groups.entries()].map(([category, items]) => ({ category, items }));
  }, [outlinedProjectsForList]);

  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * 6;
    return displayProjects.slice(start, start + 6);
  }, [displayProjects, currentPage]);

  const allFilteredSelected = filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.includes(project.id));
  const selectedOnPageCount = pagedProjects.filter((project) => selectedIds.includes(project.id)).length;

  return {
    state: {
      categoryFilter,
      statusFilter,
      searchQuery,
      currentPage,
      selectedIds,
      showSelectedOnly,
      projectViewMode,
      privateFilterMode,
      workOutlineFilter,
      preflightResult,
    },
    actions: {
      setCategoryFilter,
      setStatusFilter,
      setSearchQuery,
      setCurrentPage,
      setSelectedIds,
      setShowSelectedOnly,
      setProjectViewMode,
      setPrivateFilterMode,
      setWorkOutlineFilter,
      setPreflightResult,
    },
    derived: {
      sortedProjects,
      baseProjectsForList,
      filteredProjects,
      displayProjects,
      outlinedProjectsForList,
      groupedOutlinedProjects,
      pagedProjects,
      allFilteredSelected,
      selectedOnPageCount,
    },
  };
}
