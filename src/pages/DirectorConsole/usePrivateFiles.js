import { useEffect, useMemo, useState } from 'react';
import { EMPTY_PRIVATE_FILE_FORM } from './directorConsole.constants.js';

export function usePrivateFiles({ projects, activeTab }) {
  const [privateFilesProjectId, setPrivateFilesProjectId] = useState('');
  const [privateFileForm, setPrivateFileForm] = useState(EMPTY_PRIVATE_FILE_FORM);
  const [editingPrivateFileId, setEditingPrivateFileId] = useState(null);
  const [privateFileError, setPrivateFileError] = useState('');

  const privateProjects = useMemo(() => projects.filter((project) => project.publishStatus === 'Private'), [projects]);

  const privateFilesProject = useMemo(
    () => privateProjects.find((project) => project.id === privateFilesProjectId) || null,
    [privateProjects, privateFilesProjectId],
  );

  const privateFiles = useMemo(
    () => [...(privateFilesProject?.privateFiles || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [privateFilesProject],
  );

  useEffect(() => {
    if (activeTab !== 'privateFiles') return;
    if (privateProjects.length === 0) {
      setPrivateFilesProjectId('');
      return;
    }

    setPrivateFilesProjectId((prev) => {
      if (prev && privateProjects.some((project) => project.id === prev)) return prev;
      return privateProjects[0].id;
    });
  }, [activeTab, privateProjects]);

  useEffect(() => {
    if (activeTab !== 'privateFiles') return;
    setPrivateFileForm((prev) => ({
      ...prev,
      projectId: privateFilesProjectId,
    }));
  }, [activeTab, privateFilesProjectId]);

  return {
    privateFilesProjectId,
    setPrivateFilesProjectId,
    privateFileForm,
    setPrivateFileForm,
    editingPrivateFileId,
    setEditingPrivateFileId,
    privateFileError,
    setPrivateFileError,
    privateProjects,
    privateFiles,
    privateFilesProject,
  };
}
