import { useState } from 'react';

export function useAssetEditorModal({ inferMediaGroup, normalizeTagsInput, buildProjectDescriptionWithSlot, getAssetUrlWarning, updateAsset, addAsset }) {
  const [showAssetEditorModal, setShowAssetEditorModal] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [assetForm, setAssetForm] = useState({});
  const [assetFormError, setAssetFormError] = useState('');
  const [assetUrlWarning, setAssetUrlWarning] = useState('');

  const closeAssetEditorModal = () => {
    setShowAssetEditorModal(false);
    setEditingAssetId(null);
    setAssetForm({});
    setAssetFormError('');
    setAssetUrlWarning('');
  };

  const handleOpenAssetEditor = (asset, nextWarning) => {
    setEditingAssetId(asset.id);
    setAssetForm({
      title: asset.title,
      url: asset.url,
      type: asset.type,
      rawUrl: asset.variants?.raw || '',
      gradedUrl: asset.variants?.graded || '',
      styledUrl: asset.variants?.styled || '',
      publishTarget:
        asset.views.expertise.isActive && asset.views.project.isActive
          ? 'both'
          : asset.views.project.isActive
            ? 'project'
            : 'expertise',
      expertiseCategory: asset.views.expertise.category,
      expertiseDescription: asset.views.expertise.description,
      projectId: asset.views.project.projectId,
      projectDescription: buildProjectDescriptionWithSlot(String(asset.views.project.description || '').trim(), asset.views.project.moduleSlot),
      moduleSlot: asset.views.project.moduleSlot,
      tagsText: Array.isArray(asset.tags) ? asset.tags.join('\n') : '',
      videoCategory: asset.views.video?.category || '',
      projectDescriptionRaw: asset.views.project.description,
      mediaGroup: inferMediaGroup(asset.type, asset.url),
    });
    setAssetUrlWarning(nextWarning || getAssetUrlWarning(asset.url, asset.type));
    setShowAssetEditorModal(true);
  };

  const handleResetAssetForm = () => {
    setAssetForm({});
    setAssetFormError('');
    setAssetUrlWarning('');
    setEditingAssetId(null);
  };

  const buildAssetPayload = ({ includeVariants = false, includeVideoView = false } = {}) => {
    const variants = {
      raw: String(assetForm.rawUrl || '').trim(),
      graded: String(assetForm.gradedUrl || '').trim(),
      styled: String(assetForm.styledUrl || '').trim(),
    };

    return {
      title: String(assetForm.title || '').trim(),
      url: String(assetForm.url || '').trim(),
      type: assetForm.type,
      publishTarget: assetForm.publishTarget,
      tags: normalizeTagsInput(assetForm.tagsText),
      mediaGroup: inferMediaGroup(assetForm.type, assetForm.url),
      variants: includeVariants && assetForm.type === 'image-comparison' ? variants : undefined,
      views: {
        expertise: {
          isActive: assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both',
          category: assetForm.expertiseCategory,
          description: String(assetForm.expertiseDescription || '').trim(),
        },
        project: {
          isActive: assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both',
          projectId: assetForm.projectId,
          moduleSlot: assetForm.moduleSlot,
          description: buildProjectDescriptionWithSlot(String(assetForm.projectDescription || '').trim(), assetForm.moduleSlot),
        },
        video: includeVideoView
          ? {
              isActive: assetForm.publishTarget === 'both' && assetForm.type === 'video',
              category: assetForm.videoCategory,
              description: String(assetForm.projectDescription || '').trim(),
            }
          : undefined,
      },
    };
  };

  const validateAssetPayload = ({ payload, requireVariants = false } = {}) => {
    if (!payload.title) {
      setAssetFormError('请填写 Asset Title。');
      return false;
    }

    if (!payload.url) {
      setAssetFormError('请填写 Asset URL。');
      return false;
    }

    if (!/^https?:\/\//i.test(payload.url)) {
      setAssetFormError('Asset URL 必须是 http(s) 链接。');
      return false;
    }

    if (requireVariants && assetForm.type === 'image-comparison') {
      const variantValues = Object.values(payload.variants || {}).filter((value) => value);
      if (variantValues.length === 0) {
        setAssetFormError('请至少填写一组 variants URL。');
        return false;
      }
      if (variantValues.some((value) => !/^https?:\/\//i.test(value))) {
        setAssetFormError('Variants URL 必须是 http(s) 链接。');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleSubmitAssetForm = () => {
    const payload = buildAssetPayload({ includeVariants: true });
    if (!validateAssetPayload({ payload, requireVariants: true })) {
      return;
    }

    setAssetFormError('');
    if (assetForm.type !== 'image-comparison') {
      setAssetUrlWarning(getAssetUrlWarning(payload.url, payload.type));
    } else {
      setAssetUrlWarning('');
    }

    if (editingAssetId) {
      updateAsset(editingAssetId, payload);
    } else {
      addAsset(payload);
    }

    handleResetAssetForm();
    setShowAssetEditorModal(false);
  };

  const handleSaveAssetEditorModal = () => {
    if (!editingAssetId) {
      setAssetFormError('未选择编辑素材。');
      return;
    }

    const payload = buildAssetPayload({ includeVariants: true, includeVideoView: true });
    if (!validateAssetPayload({ payload })) {
      return;
    }

    setAssetFormError('');
    updateAsset(editingAssetId, payload);
    closeAssetEditorModal();
  };

  return {
    showAssetEditorModal,
    editingAssetId,
    assetForm,
    setAssetForm,
    assetFormError,
    setAssetFormError,
    assetUrlWarning,
    setAssetUrlWarning,
    closeAssetEditorModal,
    handleOpenAssetEditor,
    handleResetAssetForm,
    handleSubmitAssetForm,
    handleSaveAssetEditorModal,
  };
}
