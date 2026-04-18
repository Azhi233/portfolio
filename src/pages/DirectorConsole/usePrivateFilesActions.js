export function buildPrivateFileItem({ privateFileForm, editingPrivateFileId }) {
  const name = String(privateFileForm.name || '').trim();
  const url = String(privateFileForm.url || '').trim();

  return {
    name,
    url,
    error:
      !name || !url
        ? '请填写 File Name 和 File URL。'
        : !/^https?:\/\//i.test(url)
          ? 'File URL 必须是 http(s) 链接。'
          : '',
    nextItem: {
      id: editingPrivateFileId || `pf-${Date.now()}`,
      name,
      url,
      actionType: privateFileForm.actionType === 'upload' ? 'upload' : 'download',
      note: String(privateFileForm.note || '').trim(),
      enabled: Boolean(privateFileForm.enabled),
    },
  };
}

export function normalizePrivateFilesOrder(nextFiles) {
  return nextFiles.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}
