import multer from 'multer';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { createVideoTranscodeTask, getVideoTranscodeTaskByTaskId, updateVideoTranscodeTask } from '../db/videoTranscode.repository.js';
import { createTaskId, isVideoFile, processVideoTask } from './upload.helpers.js';
import { PUBLIC_BUCKET, PRIVATE_BUCKET, getPresignedUrl, uploadFile } from '../utils/minio.js';
import { createMediaAsset, listMediaAssets } from '../services/media.service.js';
import { emitTaskEvent } from '../utils/taskEvents.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

// 磁盘存储:避免大文件(含视频)整体驻留内存导致 OOM;文件落在系统临时目录,请求结束后清理
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-upload-')).then((dir) => cb(null, dir)).catch((error) => cb(error));
    },
    filename: (_req, file, cb) => cb(null, file.originalname || `upload-${Date.now()}`),
  }),
  limits: { fileSize: 20480 * 1024 * 1024 },
});

async function transcodeImageBuffer(buffer, fileName = 'image') {
  const image = sharp(buffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ? Math.min(metadata.width, 1600) : 1600;
  const output = await image.resize({ width, withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
  const baseName = String(fileName || 'image').replace(/\.[^.]+$/, '') || 'image';
  return { buffer: output, fileName: `${baseName}.webp`, mimeType: 'image/webp' };
}

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
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, message: 'file is required.' });

    const isVideo = isVideoFile(file);
    // 磁盘存储的临时目录由 multer 按请求创建,请求结束后清理
    const cleanupUploadDir = () => fs.rm(path.dirname(file.path), { recursive: true, force: true }).catch(() => {});

    try {
      const type = String(req.body?.type || 'public').toLowerCase();
      const isPrivate = type === 'private';
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const publicBaseUrl = String(process.env.MINIO_PUBLIC_BASE_URL || process.env.PUBLIC_FILE_BASE_URL || '').trim();
      const forwardedHost = String(req.headers['x-forwarded-host'] || '').trim();
      const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim();
      const proxyBaseUrl = forwardedHost ? `${forwardedProto || req.protocol}://${forwardedHost}` : '';
      const assetSpace = String(req.body?.assetSpace || req.body?.projectType || req.body?.space || 'Projects').trim() || 'Projects';
      const rootFolder = String(req.body?.root || assetSpace || 'Projects').trim() || 'Projects';
      const category = String(req.body?.category || req.body?.folder || req.body?.subfolder || '默认分类').trim() || '默认分类';

      if (isVideo) {
        const taskId = createTaskId();
        await createVideoTranscodeTask({ taskId, status: 'processing', originalPath: file.path, targetUrl: null, errorMsg: null });
        emitTaskEvent({ event: 'task-started', taskId, status: 'processing', targetUrl: null, errorMsg: null });

        processVideoTask(taskId, file.originalname || '', file.path, { baseUrl: publicBaseUrl || proxyBaseUrl || baseUrl, root: rootFolder, assetSpace, category, displayName: String(req.body?.displayName || req.body?.videoName || file.originalname || 'video').trim() || 'video', privacy: isPrivate ? 'private' : 'public' })
          .catch(async (error) => {
            const errorMsg = error?.message || 'transcode_failed';
            await updateVideoTranscodeTask(taskId, { status: 'failed', errorMsg });
            emitTaskEvent({ event: 'task-failed', taskId, status: 'failed', targetUrl: null, errorMsg });
          })
          .finally(() => cleanupUploadDir());

        return res.status(202).json({ ok: true, data: { taskId, status: 'processing', fileName: file.originalname, fileType: file.mimetype || 'application/octet-stream' } });
      }

      const uploadName = file.originalname;
      const uploadMime = file.mimetype || 'application/octet-stream';
      const mediaKind = uploadMime.startsWith('video/') ? 'video' : 'image';
      const root = String(req.body?.root || assetSpace || 'Projects').trim() || assetSpace || 'Projects';
      const displayName = String(req.body?.displayName || req.body?.title || uploadName.replace(/\.[^.]+$/, '') || 'file').trim() || 'file';
      const sections = [root, category];
      const isImage = uploadMime.startsWith('image/');
      // 图片继续做 webp 压缩(读入内存体积可控);视频/其他文件流式直传,避免大文件 OOM
      const transcoded = isImage ? await transcodeImageBuffer(await fs.readFile(file.path), uploadName) : null;
      const uploadStat = await fs.stat(file.path);
      const result = transcoded
        ? await uploadFile(transcoded.buffer, transcoded.fileName, isPrivate, transcoded.mimeType, { baseUrl: publicBaseUrl || proxyBaseUrl || baseUrl, sections, displayName })
        : await uploadFile(fs.createReadStream(file.path), uploadName, isPrivate, uploadMime, { baseUrl: publicBaseUrl || proxyBaseUrl || baseUrl, sections, displayName, size: uploadStat.size });
      await createMediaAsset({
        id: result.id || `asset-${Date.now()}`,
        kind: mediaKind,
        url: result.url || '',
        meta: {
          fileName: transcoded?.fileName || uploadName,
          size: transcoded?.buffer.length ?? uploadStat.size,
          mimeType: transcoded?.mimeType || uploadMime,
          path: result.path || '',
          convertedFrom: isImage ? uploadName : '',
        },
      });

      return res.status(201).json({ ok: true, data: { ...result, fileType: transcoded?.mimeType || uploadMime, fileName: transcoded?.fileName || uploadName, size: transcoded?.buffer.length ?? uploadStat.size, convertedFrom: isImage ? uploadName : '' } });
    } catch (error) {
      return next(error);
    } finally {
      // 视频分支由 processVideoTask 在转码完成后清理,此处仅清理图片/其他文件
      if (!isVideo) await cleanupUploadDir();
    }
  }

  async function getUploadStatus(req, res) {
    const task = await getVideoTranscodeTaskByTaskId(req.params.taskId);
    if (!task) return res.status(404).json({ ok: false, message: 'Task not found.' });
    // 剥离服务器内部字段(临时文件绝对路径)后再返回
    const { originalPath, ...safeTask } = task;
    return res.json({ ok: true, data: safeTask });
  }

  /** 为私有桶对象签发预签名 URL(前端 AutoRefreshMedia/refreshSignedUrl 调用) */
  async function postSign(req, res, next) {
    try {
      const { path: objectPath, bucketName, objectName } = req.body || {};
      const name = String(objectName || objectPath || '').trim();
      if (!name) return res.status(400).json({ ok: false, message: 'objectName is required.' });

      const knownBuckets = [String(PUBLIC_BUCKET), String(PRIVATE_BUCKET)];
      const [head, ...tail] = name.split('/');
      let bucket = String(bucketName || '').trim();
      let resolvedObject = name;
      if (!bucket && knownBuckets.includes(head)) {
        bucket = head;
        resolvedObject = tail.join('/');
      }

      const resolvedBucket = bucket || PUBLIC_BUCKET;
      const url = await getPresignedUrl(resolvedBucket, resolvedObject);
      return res.json({ ok: true, data: { url, bucketName: resolvedBucket, objectName: resolvedObject } });
    } catch (error) {
      return next(error);
    }
  }

  return { upload, getUploads, postUpload, postSign, getUploadStatus: asyncHandler(getUploadStatus) };
}
