import crypto from 'node:crypto';
import { createProject, editProject, getProjectById, listProjects, removeProject } from '../services/projects.service.js';
import { PRIVATE_BUCKET, deleteObject, getPresignedUrl } from '../utils/minio.js';
import { createMediaAsset } from '../services/media.service.js';
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
import { asyncHandler } from '../middlewares/error.middleware.js';

export function createProjectsController({ uploadProjectImage, notifyConfigChanged }) {
  /** 剥离敏感字段:accessPassword/deliveryPin/password/privateFiles 仅对已鉴权请求返回 */
  function sanitizeProjectForPublicView(project = {}) {
    const { accessPassword, deliveryPin, password, privateFiles, ...rest } = project;
    return rest;
  }

  async function getProjects(req, res) {
    const kind = String(req.query.kind || 'all').toLowerCase();
    const page = String(req.query.page || '').toLowerCase();
    const isAuthed = req.authKind === 'admin' || req.authKind === 'client';
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

    // private 项目列表仅对已鉴权请求开放(匿名请求不暴露私密项目存在性)
    if (kind === 'private' && !isAuthed) {
      return res.json({ ok: true, data: [], groups: {} });
    }

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

    const responseData = isAuthed ? withPrivateGroups : withPrivateGroups.map(sanitizeProjectForPublicView);

    res.json({ ok: true, data: responseData, groups: grouped });
  }
  async function hydratePrivateFileUrls(project, { persistBackfill = false } = {}) {
    if (!Array.isArray(project?.privateFiles) || project.privateFiles.length === 0) return project;
    let shouldPersist = false;
    const publicBaseUrl = String(process.env.MINIO_PUBLIC_BASE_URL || process.env.PUBLIC_FILE_BASE_URL || '').trim().replace(/\/+$/, '');

    const privateFiles = await Promise.all(project.privateFiles.map(async (file) => {
      const parsedRef = extractObjectRef(file?.url);
      const objectName = String(file?.objectName || '').trim() || parsedRef?.objectName || '';
      const bucketName = String(file?.bucketName || '').trim() || parsedRef?.bucketName || '';
      const directUrl = String(file?.url || '').trim();

      if (objectName && !file?.objectName) shouldPersist = true;
      if (bucketName && !file?.bucketName) shouldPersist = true;

      if (!objectName) {
        return directUrl ? { ...file, bucketName, url: directUrl } : file;
      }

      const resolvedBucket = String(bucketName || '').trim() || PRIVATE_BUCKET;
      const isPrivateBucket = String(resolvedBucket).toLowerCase() === String(PRIVATE_BUCKET).toLowerCase();
      const url = isPrivateBucket
        ? await getPresignedUrl(resolvedBucket, objectName).catch(() => directUrl)
        : publicBaseUrl ? `${publicBaseUrl}/${resolvedBucket}/${objectName}` : directUrl;
      return { ...file, bucketName: resolvedBucket, objectName, url: url || directUrl };
    }));

    const hydrated = { ...project, privateFiles };
    if (persistBackfill && shouldPersist) {
      await editProject(String(project.id), { ...project, privateFiles });
    }
    return hydrated;
  }

  async function getProject(req, res) {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }
    const isPrivateProject = String(project.visibility || '').toLowerCase() === 'private';
    const isAuthed = req.authKind === 'admin' || (req.authKind === 'client' && req.client?.projectId === String(project.id));
    if (isPrivateProject && !isAuthed) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }
    const data = attachVideoAspectRatio(await hydratePrivateFileUrls(project, { persistBackfill: isAuthed }));
    return res.json({ ok: true, data: isAuthed ? data : sanitizeProjectForPublicView(data) });
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
      const mediaEntries = [];
      const pushEntry = (entry) => {
        if (!entry?.url) return;
        mediaEntries.push(entry);
      };

      pushEntry({
        id: `${created.id}-cover`,
        kind: 'image',
        url: created.coverAssetUrl || created.coverUrl || '',
        meta: { projectId: created.id, projectTitle: created.title, role: 'cover', source: 'project-save' },
      });
      pushEntry({
        id: `${created.id}-thumbnail`,
        kind: 'image',
        url: created.thumbnailUrl || '',
        meta: { projectId: created.id, projectTitle: created.title, role: 'thumbnail', source: 'project-save' },
      });
      pushEntry({
        id: `${created.id}-video`,
        kind: 'video',
        url: created.mainVideoUrl || created.videoUrl || '',
        meta: { projectId: created.id, projectTitle: created.title, role: 'video', source: 'project-save' },
      });
      for (const [index, item] of Array.isArray(created.btsMedia) ? created.btsMedia.entries() : []) {
        const media = typeof item === 'string' ? { url: item } : item || {};
        pushEntry({
          id: `${created.id}-bts-${index}`,
          kind: String(media.kind || media.mediaType || 'image').toLowerCase(),
          url: media.url || '',
          meta: { projectId: created.id, projectTitle: created.title, role: 'bts', index, isGroupCover: Boolean(media.isGroupCover), source: 'project-save' },
        });
      }
      await Promise.all(mediaEntries.map((entry) => createMediaAsset(entry).catch((error) => {
        console.warn('Failed to sync project media asset:', entry.id, error?.message || error);
      })));

      notifyConfigChanged('projects');
      return res.status(201).json({ ok: true, data: attachVideoAspectRatio(created) });
    } catch (error) {
      console.error('Failed to create project:', error);
      return res.status(500).json({ ok: false, message: 'Failed to create project.' });
    }
  }

  async function putProject(req, res) {
    try {
      const { id } = req.params;
      const existingProject = await getProjectById(id);
      if (!existingProject) return res.status(404).json({ ok: false, message: 'Project not found.' });

      const { title, ...rest } = req.body || {};
      if (!title) return res.status(400).json({ ok: false, message: 'Project title is required.' });

      const normalizedRest = {
        ...rest,
        btsMedia: parseJsonField(rest.btsMedia, existingProject.btsMedia || []),
        privateFiles: parseJsonField(rest.privateFiles, existingProject.privateFiles || []),
        outlineTags: parseJsonField(rest.outlineTags, existingProject.outlineTags || []),
        displayOn: parseDisplayOn(rest.displayOn || rest.display_on),
        isFeatured: rest.isFeatured === 'true' || rest.isFeatured === true,
        isVisible: rest.isVisible === 'false' || rest.isVisible === false ? false : rest.isVisible,
      };

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
        ...normalizedRest,
        title,
        ...payload,
        coverAssetUrl: payload.coverAssetUrl || payload.coverUrl,
        thumbnailUrl: String(normalizedRest.thumbnailUrl || payload.coverUrl || '').trim() || payload.coverUrl,
        kind: normalizeKind(normalizedRest),
        mediaType: normalizeMediaType(normalizedRest),
        displayOn: normalizedRest.displayOn,
        featuredOrder: normalizedRest.isFeatured ? normalizedRest.featuredOrder : null,
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

      const mediaEntries = [];
      const pushEntry = (entry) => {
        if (!entry?.url) return;
        mediaEntries.push(entry);
      };

      pushEntry({
        id: `${updated.id}-cover`,
        kind: 'image',
        url: updated.coverAssetUrl || updated.coverUrl || '',
        meta: { projectId: updated.id, projectTitle: updated.title, role: 'cover', source: 'project-save' },
      });
      pushEntry({
        id: `${updated.id}-thumbnail`,
        kind: 'image',
        url: updated.thumbnailUrl || '',
        meta: { projectId: updated.id, projectTitle: updated.title, role: 'thumbnail', source: 'project-save' },
      });
      pushEntry({
        id: `${updated.id}-video`,
        kind: 'video',
        url: updated.mainVideoUrl || updated.videoUrl || '',
        meta: { projectId: updated.id, projectTitle: updated.title, role: 'video', source: 'project-save' },
      });
      for (const [index, item] of Array.isArray(updated.btsMedia) ? updated.btsMedia.entries() : []) {
        const media = typeof item === 'string' ? { url: item } : item || {};
        pushEntry({
          id: `${updated.id}-bts-${index}`,
          kind: String(media.kind || media.mediaType || 'image').toLowerCase(),
          url: media.url || '',
          meta: { projectId: updated.id, projectTitle: updated.title, role: 'bts', index, isGroupCover: Boolean(media.isGroupCover), source: 'project-save' },
        });
      }
      await Promise.all(mediaEntries.map((entry) => createMediaAsset(entry).catch((error) => {
        console.warn('Failed to sync project media asset:', entry.id, error?.message || error);
      })));

      notifyConfigChanged('projects');
      return res.json({ ok: true, data: attachVideoAspectRatio(updated) });
    } catch (error) {
      console.error('Failed to update project:', error);
      return res.status(500).json({ ok: false, message: 'Failed to update project.' });
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

    for (const [, entry] of objectNamesToDelete) {
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

  return {
    getProjects: asyncHandler(getProjects),
    getProject: asyncHandler(getProject),
    postProject,
    putProject,
    deleteProject: asyncHandler(deleteProject),
  };
}
