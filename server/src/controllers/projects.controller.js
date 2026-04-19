import crypto from 'node:crypto';
import { createProject, editProject, getProjectById, listProjects, removeProject } from '../services/projects.service.js';

function parseJsonField(value, fallback = []) {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function createProjectsController({ uploadProjectImage, notifyConfigChanged, pool }) {
  async function getProjects(req, res) {
    const kind = String(req.query.kind || 'all').toLowerCase();
    const items = await listProjects();
    const filtered = kind === 'photos'
      ? items.filter((item) => !(item.mainVideoUrl || item.videoUrl))
      : kind === 'videos'
        ? items.filter((item) => Boolean(item.mainVideoUrl || item.videoUrl))
        : items;
    res.json({ ok: true, data: filtered });
  }

  async function getProject(req, res) {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }
    return res.json({ ok: true, data: project });
  }

  async function postProject(req, res) {
    try {
      const project = req.body || {};
      let coverUrl = String(project.coverUrl || project.thumbnailUrl || '').trim();
      let coverAssetUrl = String(project.coverAssetUrl || '').trim();
      let coverAssetObjectName = String(project.coverAssetObjectName || '').trim();
      let coverAssetFileType = String(project.coverAssetFileType || '').trim();
      let coverAssetIsPrivate = project.coverAssetIsPrivate === 'true' || project.coverAssetIsPrivate === true;

      if (req.file) {
        const uploadResult = await uploadProjectImage(req.file);
        coverUrl = uploadResult.url;
        coverAssetUrl = uploadResult.url;
        coverAssetObjectName = uploadResult.objectName || '';
        coverAssetFileType = req.file.mimetype || 'application/octet-stream';
        coverAssetIsPrivate = false;
      }

      const payload = {
        ...project,
        id: String(project.id || crypto.randomUUID()),
        title: String(project.title || '').trim(),
        category: String(project.category || '').trim() || null,
        role: String(project.role || '').trim() || null,
        releaseDate: String(project.releaseDate || '').trim() || null,
        coverUrl,
        coverAssetUrl,
        coverAssetObjectName,
        coverAssetFileType,
        coverAssetIsPrivate,
        thumbnailUrl: String(project.thumbnailUrl || coverUrl || '').trim() || coverUrl,
        videoUrl: String(project.videoUrl || '').trim() || null,
        mainVideoUrl: String(project.mainVideoUrl || project.videoUrl || '').trim() || null,
        btsMedia: parseJsonField(project.btsMedia, []),
        clientAgency: String(project.clientAgency || '').trim() || null,
        clientCode: String(project.clientCode || '').trim() || null,
        isFeatured: project.isFeatured === 'true' || project.isFeatured === true,
        sortOrder: Number.isFinite(Number(project.sortOrder)) ? Number(project.sortOrder) : 0,
        description: String(project.description || '').trim() || null,
        credits: String(project.credits || '').trim() || null,
        isVisible: project.isVisible === 'false' || project.isVisible === false ? 0 : 1,
        publishStatus: String(project.publishStatus || 'Draft').trim(),
        visibility: String(project.visibility || project.publishStatus || 'Draft').trim(),
        accessPassword: String(project.accessPassword || project.password || '').trim() || null,
        deliveryPin: String(project.deliveryPin || '').trim() || null,
        status: String(project.status || 'draft').trim(),
        password: String(project.password || project.accessPassword || '').trim() || null,
        privateFiles: parseJsonField(project.privateFiles, []),
        outlineTags: parseJsonField(project.outlineTags, []),
      };

      if (!payload.id || !payload.title) {
        return res.status(400).json({ ok: false, message: 'Project id and title are required.' });
      }

      const created = await createProject(payload);
      notifyConfigChanged('projects');
      return res.status(201).json({ ok: true, data: created });
    } catch (error) {
      console.error('Failed to create project:', error);
      return res.status(500).json({ ok: false, message: 'Failed to create project.', detail: error?.message || '' });
    }
  }

  async function putProject(req, res) {
    try {
      const { id } = req.params;
      const [existingRows] = await pool.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [id]);
      if (!existingRows[0]) {
        return res.status(404).json({ ok: false, message: 'Project not found.' });
      }

      const { title, ...rest } = req.body || {};
      if (!title) {
        return res.status(400).json({ ok: false, message: 'Project title is required.' });
      }

      let coverUrl = String(rest.coverUrl || rest.thumbnailUrl || '').trim();
      if (req.file) {
        const uploadResult = await uploadProjectImage(req.file);
        coverUrl = uploadResult.url;
      }

      const updated = await editProject(id, {
        ...rest,
        title,
        coverUrl,
        thumbnailUrl: String(rest.thumbnailUrl || coverUrl || '').trim() || coverUrl,
      });
      notifyConfigChanged('projects');
      return res.json({ ok: true, data: updated });
    } catch (error) {
      console.error('Failed to update project:', error);
      return res.status(500).json({ ok: false, message: 'Failed to update project.', detail: error?.message || '' });
    }
  }

  async function deleteProject(req, res) {
    const deleted = await removeProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }
    notifyConfigChanged('projects');
    return res.json({ ok: true, data: { id: req.params.id } });
  }

  return { getProjects, getProject, postProject, putProject, deleteProject };
}
