export function getPrivateAccessCode(project) {
  return String(project?.accessPassword || project?.password || project?.deliveryPin || '').trim();
}

export function canAccessPrivateProject(project, token, showAccess) {
  const privateAccessCode = getPrivateAccessCode(project);
  const isPrivateProject = String(project?.visibility || '').toLowerCase() === 'private';
  const hasPrivateAccess = Boolean(privateAccessCode || isPrivateProject);
  const canViewPrivate = !hasPrivateAccess || Boolean(token && showAccess);
  return { privateAccessCode, isPrivateProject, hasPrivateAccess, canViewPrivate };
}

export function getProjectGallery(project, canViewPrivate) {
  if (!canViewPrivate) return { gallery: [], files: [] };
  const mediaItems = Array.isArray(project?.btsMedia) ? project.btsMedia : [];
  const privateItems = Array.isArray(project?.privateFiles) ? project.privateFiles : [];
  const gallery = [...mediaItems, ...privateItems].filter((item) => item?.url);
  const files = privateItems.filter((item) => item?.enabled !== false);
  return { gallery, files };
}

export function splitGalleryByKind(gallery) {
  return {
    galleryImages: gallery.filter((item) => !String(item.kind || '').startsWith('video')),
    galleryVideos: gallery.filter((item) => String(item.kind || '').startsWith('video')),
  };
}
