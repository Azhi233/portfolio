export function parseBulkAssetInput({
  bulkAssetInput,
  parseAssetNameToken,
  inferAssetTypeFromUrl,
  inferMediaGroup,
  setBulkAssetError,
  setBulkAssetPreview,
  setBulkAssetSelectedKeys,
  setBulkAssetCollapsedGroups,
  setBulkAssetForm,
}) {
  const lines = String(bulkAssetInput || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    setBulkAssetError('请先粘贴至少一条 URL。');
    return;
  }

  const parsed = lines.map((url) => {
    const normalizedUrl = url.replace(/\s+/g, '');
    const fileName = String(normalizedUrl.split('?')[0] || '').split('/').pop() || '';
    const token = parseAssetNameToken(fileName);
    const inferredType = inferAssetTypeFromUrl(normalizedUrl);
    const mediaGroup = inferMediaGroup(inferredType, normalizedUrl);
    const autoTags = token
      ? [
          token.product,
          token.theme,
          token.orientation,
          token.resolution,
          token.stage,
          token.codec,
          token.year ? String(token.year) : '',
          token.month ? String(token.month).padStart(2, '0') : '',
        ].filter(Boolean)
      : [];

    return {
      url: normalizedUrl,
      fileName,
      token,
      inferredType,
      type: inferredType,
      mediaGroup,
      autoDetected: Boolean(token),
      title: token?.title || fileName || normalizedUrl,
      autoTags,
      tagsText: autoTags.join(', '),
      tagSummary: autoTags.join(' · '),
    };
  });

  if (parsed.length === 0) {
    setBulkAssetError('未识别到任何 URL。');
    setBulkAssetPreview([]);
    return;
  }

  setBulkAssetError('');
  setBulkAssetPreview(parsed);
  setBulkAssetSelectedKeys(parsed.map((item, index) => `${item.fileName}-${index}`));
  setBulkAssetCollapsedGroups([]);
  setBulkAssetForm((prev) => ({
    ...prev,
    manualTagsText: parsed.flatMap((item) => item.autoTags).slice(0, 8).join(', '),
  }));
}

export function createBulkAssets({
  bulkAssetPreview,
  bulkAssetSelectedKeys,
  bulkAssetForm,
  assetForm,
  normalizeTagsInput,
  inferMediaGroup,
  buildProjectDescriptionWithSlot,
  addAssets,
  setBulkAssetError,
  setBulkAssetInput,
  setBulkAssetPreview,
  setBulkAssetSelectedKeys,
}) {
  if (bulkAssetPreview.length === 0) {
    setBulkAssetError('请先解析 URL 再批量创建。');
    return;
  }

  const selected = bulkAssetPreview.filter((item, index) =>
    bulkAssetSelectedKeys.includes(`${item.fileName}-${index}`),
  );

  if (selected.length === 0) {
    setBulkAssetError('请至少勾选一条预览项。');
    return;
  }

  const manualTags = normalizeTagsInput(bulkAssetForm.manualTagsText);
  const payloads = selected.map((item) => ({
    title: item.title,
    url: item.url,
    type: item.type,
    mediaGroup: item.mediaGroup || inferMediaGroup(item.type, item.url),
    tags: manualTags.length > 0 ? manualTags : normalizeTagsInput(item.tagsText),
    publishTarget: item.mediaGroup === 'video' || item.type === 'video' ? 'video' : assetForm.publishTarget,
    views: {
      expertise: {
        isActive: assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both',
        category: assetForm.expertiseCategory,
        description: String(assetForm.expertiseDescription || '').trim(),
      },
      project: {
        isActive: assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both',
        projectId: assetForm.projectId,
        description: buildProjectDescriptionWithSlot(
          String(assetForm.projectDescription || '').trim(),
          assetForm.moduleSlot,
        ),
      },
    },
  }));

  addAssets(payloads);
  setBulkAssetInput('');
  setBulkAssetPreview([]);
  setBulkAssetSelectedKeys([]);
  setBulkAssetError('');
}
