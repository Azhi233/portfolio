import multer from 'multer';
import { createVideoTranscodeTask, getVideoTranscodeTaskByTaskId, updateVideoTranscodeTask } from '../db/videoTranscode.repository.js';
import { createTaskId, isVideoFile, processVideoTask } from './upload.helpers.js';
import { uploadFile } from '../utils/minio.js';
import { createMediaAsset, listMediaAssets } from '../services/media.service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20480 * 1024 * 1024 } });

export function createUploadController() {
  async function getUploads(_req, res, next) {
    try {
      const items = await listMediaAssets();
      return res.json({ ok: true, data: items });
    } catch (error) {
      return next(error);
    }
  }

  async function postUpload(req, res, next) {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ ok: false, message: 'file is required.' });

      const type = String(req.body?.type || 'public').toLowerCase();
      const isPrivate = type === 'private';
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const publicBaseUrl = String(process.env.MINIO_PUBLIC_BASE_URL || process.env.PUBLIC_FILE_BASE_URL || '').trim();
      const forwardedHost = String(req.headers['x-forwarded-host'] || '').trim();
      const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim();
      const proxyBaseUrl = forwardedHost ? `${forwardedProto || req.protocol}://${forwardedHost}` : '';

      if (isVideoFile(file)) {
        const taskId = createTaskId();
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-upload-'));
        const originalPath = path.join(tempDir, file.originalname || `${taskId}.bin`);
        await fs.writeFile(originalPath, file.buffer);

        await createVideoTranscodeTask({ taskId, status: 'processing', originalPath, targetUrl: null, errorMsg: null });
        emitTaskEvent({ event: 'task-started', taskId, status: 'processing', targetUrl: null, errorMsg: null });

        processVideoTask(taskId, file.originalname || '', file.buffer, { baseUrl: publicBaseUrl || proxyBaseUrl || baseUrl })
          .catch(async (error) => {
            const errorMsg = error?.message || 'transcode_failed';
            await updateVideoTranscodeTask(taskId, { status: 'failed', errorMsg });
            emitTaskEvent({ event: 'task-failed', taskId, status: 'failed', targetUrl: null, errorMsg });
          })
          .finally(() => fs.rm(tempDir, { recursive: true, force: true }).catch(() => {}));

        return res.status(202).json({ ok: true, data: { taskId, status: 'processing', fileName: file.originalname, fileType: file.mimetype || 'application/octet-stream' } });
      }

      const uploadBuffer = file.buffer;
      const uploadName = file.originalname;
      const uploadMime = file.mimetype || 'application/octet-stream';
      const result = await uploadFile(uploadBuffer, uploadName, isPrivate, uploadMime, { baseUrl: publicBaseUrl || proxyBaseUrl || baseUrl });
      const mediaKind = uploadMime.startsWith('video/') ? 'video' : 'image';
      await createMediaAsset({
        id: result.id || `asset-${Date.now()}`,
        kind: mediaKind,
        url: result.url || '',
        meta: {
          fileName: uploadName,
          size: uploadBuffer.length,
          mimeType: uploadMime,
          path: result.path || '',
          convertedFrom: '',
        },
      });

      return res.status(201).json({ ok: true, data: { ...result, fileType: uploadMime, fileName: uploadName, size: uploadBuffer.length, convertedFrom: '' } });
    } catch (error) {
      return next(error);
    }
  }

  async function getUploadStatus(req, res) {
    const task = await getVideoTranscodeTaskByTaskId(req.params.taskId);
    if (!task) return res.status(404).json({ ok: false, message: 'Task not found.' });
    return res.json({ ok: true, data: task });
  }

  return { upload, getUploads, postUpload, getUploadStatus };
}
