export function useProjectFormSubmit({ formMode, editingProjectId, formState, projects, runProjectPreflight, updateProjectApi, createProject, updateProject, handleCancelForm }) {
  const handleSubmitForm = async (event) => {
    event.preventDefault();

    const nextVisibility = formState.isPrivate
      ? 'Private'
      : formState.publishStatus === 'Draft'
        ? 'Draft'
        : 'Published';

    const payload = {
      ...formState,
      videoUrl: String(formState.videoUrl || formState.mainVideoUrl || '').trim(),
      mainVideoUrl: String(formState.mainVideoUrl || formState.videoUrl || '').trim(),
      publishStatus: nextVisibility,
      btsMedia: formState.btsMediaText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      visibility: nextVisibility,
      isVisible: nextVisibility !== 'Draft',
      accessPassword: nextVisibility === 'Private' ? formState.accessPassword : '',
      deliveryPin: nextVisibility === 'Private' ? String(formState.deliveryPin || '').trim() : '',
      clientCode: String(formState.clientCode || '').trim(),
      outlineTags: Array.isArray(formState.outlineTags)
        ? formState.outlineTags.map((tag) => String(tag || '').trim()).filter(Boolean)
        : [],
    };

    if (payload.publishStatus === 'Private' && String(payload.accessPassword || '').trim().length < 4) {
      window.alert('私密项目密码至少需 4 位字符。');
      return;
    }

    const normalizedClientCode = String(payload.clientCode || '').trim().toLowerCase();
    if (normalizedClientCode) {
      const duplicated = projects.some(
        (item) =>
          item.id !== (editingProjectId || '') &&
          String(item.clientCode || '').trim().toLowerCase() === normalizedClientCode,
      );
      if (duplicated) {
        window.alert('Client Code 已存在，请使用唯一代码。');
        return;
      }
    }

    if (payload.publishStatus === 'Published') {
      const check = runProjectPreflight([{ ...payload, id: editingProjectId || 'new' }]);
      if (check.errorCount > 0 || check.warningCount > 0) {
        const preview = check.issues
          .slice(0, 5)
          .map((x) => `- [${x.severity.toUpperCase()}] ${x.message}`)
          .join('\n');
        const continueSubmit = window.confirm(`Preflight found ${check.errorCount} error(s), ${check.warningCount} warning(s).\n\n${preview}\n\nContinue saving?`);
        if (!continueSubmit) return;
      }
    }

    try {
      if (formMode === 'edit' && editingProjectId) {
        const saved = await updateProjectApi(editingProjectId, {
          ...payload,
        });
        if (saved) {
          updateProject(saved.id, saved);
        }
      } else {
        const saved = await createProject({
          ...payload,
        });
        if (saved) {
          updateProject(saved.id, saved);
        }
      }
      handleCancelForm();
    } catch (error) {
      console.error('Failed to save project:', error);
      window.alert(error?.response?.data?.message || error?.message || '保存作品失败');
    }
  };

  return { handleSubmitForm };
}
