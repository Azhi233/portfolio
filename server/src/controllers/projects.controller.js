import crypto from 'node:crypto';
import { createProject, editProject, getProjectById, listProjects, removeProject } from '../services/projects.service.js';
import { deleteObject } from '../utils/minio.js';
import {
  attachVideoAspectRatio,
  buildProjectPayload,
  extractObjectRef,
  normalizeKind,
  normalizeMediaType,
  normalizeRefs,
  parseDisplayOn,
  parseJsonField,
} from './projects.controller.helpers.js';

export function createProjectsController({ uploadProjectImage, notifyConfigChanged }) {
  async function getProjects(req, res) {
    const kind = String(req.query.kind || 'all').toLowerCase();
    const page = String(req.query.page || '').toLowerCase();
    const items = await listProjects();
    const normalized = items.map((item) => ({
      ...attachVideoAspectRatio(item),
      kind: normalizeKind(item),
      mediaType: normalizeMediaType(item),
      displayOn: parseDisplayOn(item.displayOn || item.content_json?.displayOn || item.content_json?.display_on),
      visibility: String(item.visibility || 'public').toLowerCase(),
    }));

    const pageFiltered = page
      ? normalized.filter((item) => (Array.isArray(item.displayOn) && item.displayOn.length ? item.displayOn.includes(page) : true))
      : normalized;

    const privateGroupIds = new Map();
    pageFiltered.forEach((item) => {
      if (item.visibility === 'private' && item.accessPassword) {
        const key = String(item.accessPassword).trim();
        if (!privateGroupIds.has(key)) privateGroupIds.set(key, []);
        privateGroupIds.get(key).push(item);
      }
    });

    const filtered = kind === 'photos' || kind === 'images'
      ? pageFiltered.filter((item) => item.mediaType === 'image' && item.visibility !== 'private')
      : kind === 'videos'
        ? pageFiltered.filter((item) => item.mediaType === 'video' && item.visibility !== 'private')
        : kind === 'private'
          ? pageFiltered.filter((item) => item.visibility === 'private')
          : pageFiltered.filter((item) => item.visibility !== 'private');

    const withPrivateGroups = filtered.map((item) => {
      if (item.visibility !== 'private' || !item.accessPassword) return item;
      const group = privateGroupIds.get(String(item.accessPassword).trim()) || [];
      return { ...item, privateGroupSize: group.length };
    });

    const grouped = withPrivateGroups.reduce((acc, item) => {
      const groupName = String(item.category || 'Uncategorized').trim() || 'Uncategorized';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(item);
      return acc;
    }, {});

    res.json({ ok: true, data: withPrivateGroups, groups: grouped });
  }

  async function getProject(req, res) {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }
    return res.json({ ok: true, data: attachVideoAspectRatio(project) });
  }

  async function postProject(req, res) {
    try {
      const project = req.body || {};
      const kind = normalizeKind(project);
      const mediaType = normalizeMediaType(project);
      const displayOn = parseDisplayOn(project.displayOn || project.display_on);
      const payload = buildProjectPayload(project, req.file);

      if (req.file) {
        const uploadResult = await uploadProjectImage(req.file);
        payload.coverUrl = uploadResult.url;
        payload.coverAssetUrl = uploadResult.url;
        payload.coverAssetObjectName = uploadResult.objectName || '';
        payload.coverAssetFileType = req.file.mimetype || 'application/octet-stream';
        payload.coverAssetIsPrivate = false;
      }

      const createdPayload = {
        ...project,
        id: String(project.id || crypto.randomUUID()),
        title: String(project.title || '').trim(),
        category: String(project.category || '').trim() || null,
        role: String(project.role || '').trim() || null,
        releaseDate: String(project.releaseDate || '').trim() || null,
        ...payload,
        thumbnailUrl: String(project.thumbnailUrl || payload.coverUrl || '').trim() || payload.coverUrl,
        videoUrl: String(project.videoUrl || '').trim() || null,
        mainVideoUrl: String(project.mainVideoUrl || project.videoUrl || '').trim() || null,
        btsMedia: parseJsonField(project.btsMedia, []).map((item) => ({ ...(typeof item === 'string' ? { url: item } : item), isGroupCover: Boolean(item?.isGroupCover) })),
        clientAgency: String(project.clientAgency || '').trim() || null,
        clientCode: String(project.clientCode || '').trim() || null,
        isFeatured: project.isFeatured === 'true' || project.isFeatured === true,
        sortOrder: Number.isFinite(Number(project.sortOrder)) ? Number(project.sortOrder) : 0,
        description: String(project.description || '').trim() || null,
        credits: String(project.credits || '').trim() || null,
        isVisible: project.isVisible === 'false' || project.isVisible === false ? 0 : 1,
        publishStatus: String(project.publishStatus || 'Draft').trim(),
        visibility: String(project.visibility || project.publishStatus || 'public').trim().toLowerCase(),
        kind,
        mediaType,
        displayOn,
        accessPassword: String(project.accessPassword || project.password || '').trim() || null,
        deliveryPin: String(project.deliveryPin || '').trim() || null,
        status: String(project.status || 'draft').trim(),
        password: String(project.password || project.accessPassword || '').trim() || null,
        privateFiles: parseJsonField(project.privateFiles, []),
        outlineTags: parseJsonField(project.outlineTags, []),
      };

      if (!createdPayload.id || !createdPayload.title) {
        return res.status(400).json({ ok: false, message: 'Project id and title are required.' });
      }

      const created = await createProject(createdPayload);
      notifyConfigChanged('projects');
      return res.status(201).json({ ok: true, data: attachVideoAspectRatio(created) });
    } catch (error) {
      console.error('Failed to create project:', error);
      return res.status(500).json({ ok: false, message: 'Failed to create project.', detail: error?.message || '' });
    }
  }

  async function putProject(req, res) {
    try {
      const { id } = req.params;
      const existingProject = await getProjectById(id);
      if (!existingProject) return res.status(404).json({ ok: false, message: 'Project not found.' });

      const { title, ...rest } = req.body || {};
      if (!title) return res.status(400).json({ ok: false, message: 'Project title is required.' });

      const oldCoverRef = extractObjectRef(existingProject.coverAssetUrl || existingProject.coverUrl);
      const oldThumbnailRef = extractObjectRef(existingProject.thumbnailUrl);
      const oldVideoRef = extractObjectRef(existingProject.mainVideoUrl || existingProject.videoUrl);
      const shouldCleanOldCover = Boolean(req.file) && oldCoverRef;
      const hasPrivateFilesUpdate = Object.prototype.hasOwnProperty.call(req.body || {}, 'privateFiles');
      const hasBtsMediaUpdate = Object.prototype.hasOwnProperty.call(req.body || {}, 'btsMedia');
      const payload = buildProjectPayload(rest, req.file);

      if (req.file) {
        const uploadResult = await uploadProjectImage(req.file);
        payload.coverUrl = uploadResult.url;
        payload.coverAssetUrl = uploadResult.url;
        payload.coverAssetObjectName = uploadResult.objectName || '';
        payload.coverAssetFileType = req.file.mimetype || 'application/octet-stream';
        payload.coverAssetIsPrivate = false;
      }

      const updated = await editProject(id, {
        ...rest,
        title,
        ...payload,
        coverAssetUrl: payload.coverAssetUrl || payload.coverUrl,
        thumbnailUrl: String(rest.thumbnailUrl || payload.coverUrl || '').trim() || payload.coverUrl,
        kind: normalizeKind(rest),
        mediaType: normalizeMediaType(rest),
        displayOn: parseDisplayOn(rest.displayOn || rest.display_on),
      });

      if (shouldCleanOldCover || hasPrivateFilesUpdate || hasBtsMediaUpdate) {
        const refsToDelete = [];
        const newCoverRef = extractObjectRef(updated.coverAssetUrl || updated.coverUrl);
        const newThumbnailRef = extractObjectRef(updated.thumbnailUrl);
        const newVideoRef = extractObjectRef(updated.mainVideoUrl || updated.videoUrl);

        if (shouldCleanOldCover) {
          [oldCoverRef, oldThumbnailRef].forEach((ref) => {
            if (ref && ![newCoverRef, newThumbnailRef].some((nextRef) => nextRef?.bucketName === ref.bucketName && nextRef?.objectName === ref.objectName)) refsToDelete.push(ref);
          });
        }

        if (oldVideoRef && ![newVideoRef].some((nextRef) => nextRef?.bucketName === oldVideoRef.bucketName && nextRef?.objectName === oldVideoRef.objectName)) refsToDelete.push(oldVideoRef);

        if (hasPrivateFilesUpdate) {
          const oldRefs = normalizeRefs(existingProject.privateFiles);
          const nextRefs = normalizeRefs(updated.privateFiles);
          oldRefs.forEach((ref) => {
            if (!nextRefs.some((nextRef) => nextRef.bucketName === ref.bucketName && nextRef.objectName === ref.objectName)) refsToDelete.push(ref);
          });
        }

        if (hasBtsMediaUpdate) {
          const oldRefs = normalizeRefs(existingProject.btsMedia);
          const nextRefs = normalizeRefs(updated.btsMedia);
          oldRefs.forEach((ref) => {
            if (!nextRefs.some((nextRef) => nextRef.bucketName === ref.bucketName && nextRef.objectName === ref.objectName)) refsToDelete.push(ref);
          });
        }

        const seen = new Set();
        for (const ref of refsToDelete) {
          const key = `${ref.bucketName}:${ref.objectName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          try {
            await deleteObject(ref.bucketName, ref.objectName);
          } catch (error) {
            console.warn('Failed to delete previous MinIO object during project update:', ref.objectName, error?.message || error);
          }
        }
      }

      notifyConfigChanged('projects');
      return res.json({ ok: true, data: attachVideoAspectRatio(updated) });
    } catch (error) {
      console.error('Failed to update project:', error);
      return res.status(500).json({ ok: false, message: 'Failed to update project.', detail: error?.message || '' });
    }
  }

  async function deleteProject(req, res) {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }

    const objectNamesToDelete = new Map();
    [project.coverAssetUrl || project.coverUrl, project.thumbnailUrl, project.mainVideoUrl || project.videoUrl].forEach((url) => {
      const ref = extractObjectRef(url);
      if (ref) objectNamesToDelete.set(`${ref.bucketName}:${ref.objectName}`, ref);
    });

    for (const item of Array.isArray(project.privateFiles) ? project.privateFiles : []) {
      const refs = normalizeRefs([item]);
      refs.forEach((ref) => objectNamesToDelete.set(`${ref.bucketName}:${ref.objectName}`, ref));
    }

    for (const asset of Array.isArray(project.btsMedia) ? project.btsMedia : []) {
      const refs = normalizeRefs([asset]);
      refs.forEach((ref) => objectNamesToDelete.set(`${ref.bucketName}:${ref.objectName}`, ref));
    }

    for (const entry of objectNamesToDelete) {
      try {
        await deleteObject(entry.bucketName, entry.objectName);
      } catch (error) {
        console.warn('Failed to delete MinIO object during project removal:', entry.objectName, error?.message || error);
      }
    }

    const deleted = await removeProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }
    notifyConfigChanged('projects');
    return res.json({ ok: true, data: { id: req.params.id } });
  }

  return { getProjects, getProject, postProject, putProject, deleteProject };
}
