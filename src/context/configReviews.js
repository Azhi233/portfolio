function normalizeReview(item, index = 0) {
  const type = item?.authorType === 'company' ? 'company' : 'personal';
  const status = ['pending', 'approved', 'rejected'].includes(item?.status) ? item.status : 'approved';

  return {
    id: String(item?.id || `review-${Date.now()}-${index}`),
    projectId: String(item?.projectId || ''),
    projectName: String(item?.projectName || 'Untitled Project'),
    clientName: String(item?.clientName || '匿名用户'),
    companyName: type === 'company' ? String(item?.companyName || '') : '',
    position: type === 'company' ? String(item?.position || '') : '',
    content: String(item?.content || ''),
    coverUrl: String(item?.coverUrl || ''),
    isFeatured: Boolean(item?.isFeatured),
    authorType: type,
    isAnonymous: Boolean(item?.isAnonymous),
    status,
    createdAt: String(item?.createdAt || new Date().toISOString()),
  };
}

export { normalizeReview };
