export const PAGE_SIZE = 6;

export function getProjectGroupKey(item) {
  const tags = Array.isArray(item?.outlineTags) ? item.outlineTags : Array.isArray(item?.tags) ? item.tags : [];
  const firstTag = String(tags.find((tag) => String(tag || '').trim()) || '').trim();
  if (firstTag) return firstTag.toLowerCase();
  const category = String(item?.category || '').trim();
  if (category) return category.toLowerCase();
  return 'uncategorized';
}

export function getProjectGroupName(item) {
  const tags = Array.isArray(item?.outlineTags) ? item.outlineTags : Array.isArray(item?.tags) ? item.tags : [];
  const firstTag = String(tags.find((tag) => String(tag || '').trim()) || '').trim();
  if (firstTag) return firstTag;
  return String(item?.category || 'Uncategorized').trim() || 'Uncategorized';
}

export function getGroupCoverProject(projects = []) {
  const list = Array.isArray(projects) ? projects : [];
  return list.find((item) => item?.isFeatured) || list[0] || null;
}

export function groupProjectsByCategory(items) {
  const groups = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const groupName = getProjectGroupName(item);
    const groupKey = getProjectGroupKey(item);
    if (!groups.has(groupKey)) groups.set(groupKey, { key: groupKey, name: groupName, projects: [] });
    groups.get(groupKey).projects.push(item);
  }
  return Array.from(groups.values()).map((group) => ({
    ...group,
    coverProject: getGroupCoverProject(group.projects),
  }));
}

export function filterEmptyGroups(groups) {
  return (Array.isArray(groups) ? groups : []).filter((group) => Array.isArray(group?.projects) && group.projects.length > 0);
}

export function filterProjectsByText(items, query, category) {
  const normalizedQuery = String(query || '').trim().toLowerCase();

  return (Array.isArray(items) ? items : []).filter((item) => {
    const matchesCategory = category === 'all' || getProjectGroupName(item) === category;
    const matchesQuery = !normalizedQuery || `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
}

export function filterVideoProjects(items, query, category) {
  return filterProjectsByText(items, query, category).filter((item) => Boolean(item.mainVideoUrl || item.videoUrl));
}

export function filterImageProjects(items, query, category) {
  return filterProjectsByText(items, query, category).filter((item) => Boolean(item.coverUrl || item.thumbnailUrl) && !(item.mainVideoUrl || item.videoUrl));
}

export function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil((Array.isArray(items) ? items.length : 0) / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { totalPages, page: safePage, items: (Array.isArray(items) ? items : []).slice(start, start + pageSize) };
}
