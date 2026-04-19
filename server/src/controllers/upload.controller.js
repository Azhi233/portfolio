import multer from 'multer';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createVideoTranscodeTask, getVideoTranscodeTaskByTaskId, updateVideoTranscodeTask } from '../db.js';
import { emitTaskEvent } from '../utils/taskEvents.js';
import { uploadFile } from '../utils/minio.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20480 * 1024 * 1024 } });

function createTaskId() {
  return `video-task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isVideoFile(file = {}) {
  const name = String(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  return mime.startsWith('video/') || name.endsWith('.mov') || name.endsWith('.mp4') || mime === 'video/quicktime';
}

function runFfmpegTranscode(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', inputPath, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', outputPath];
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const succeed = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', fail);
    child.on('exit', (code, signal) => {
      if (code === 0) return succeed();
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      fail(new Error(`ffmpeg exited with ${reason}${stderr ? `: ${stderr.slice(-500)}` : ''}`));
    });
    child.on('close', (code, signal) => {
      if (settled) return;
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      fail(new Error(`ffmpeg closed with ${reason}${stderr ? `: ${stderr.slice(-500)}` : ''}`));
    });
  });
}

async function processVideoTask(taskId, originalName, buffer, reqMeta) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-video-'));
  const inputPath = path.join(tempDir, originalName || 'input');
  const outputPath = path.join(tempDir, `${path.basename(originalName, path.extname(originalName)) || 'video'}.mp4`);

  try {
    await updateVideoTranscodeTask(taskId, { status: 'processing' });
    await fs.writeFile(inputPath, buffer);
    await runFfmpegTranscode(inputPath, outputPath);
    const uploadBuffer = await fs.readFile(outputPath);
    const uploadName = `${path.basename(originalName, path.extname(originalName)) || 'video'}.mp4`;
    const result = await uploadFile(uploadBuffer, uploadName, false, 'video/mp4', { baseUrl: reqMeta.baseUrl });

    await updateVideoTranscodeTask(taskId, { status: 'completed', targetUrl: result.url, errorMsg: null });
    emitTaskEvent({ event: 'task-completed', taskId, status: 'completed', targetUrl: result.url, errorMsg: null });
  } catch (error) {
    const errorMsg = error?.message || 'transcode_failed';
    await updateVideoTranscodeTask(taskId, { status: 'failed', errorMsg });
    emitTaskEvent({ event: 'task-failed', taskId, status: 'failed', targetUrl: null, errorMsg });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export function createUploadController() {
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

  return { upload, postUpload, getUploadStatus };
}
