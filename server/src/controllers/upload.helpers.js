import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { updateVideoTranscodeTask } from '../db/videoTranscode.repository.js';
import { emitTaskEvent } from '../utils/taskEvents.js';
import { uploadFile } from '../utils/minio.js';

export function createTaskId() {
  return `video-task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isVideoFile(file = {}) {
  const name = String(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  if (name.endsWith('.mp4') || mime === 'video/mp4') return false;
  return mime.startsWith('video/') || name.endsWith('.mov') || mime === 'video/quicktime';
}

export function runFfmpegTranscode(inputPath, outputPath) {
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

function safePathSegment(value = '', fallback = 'video') {
  const segment = String(value)
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/[<>:"|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return segment || fallback;
}

function detectMimeKind(mime = '', fileName = '') {
  const lowerMime = String(mime).toLowerCase();
  const lowerName = String(fileName).toLowerCase();
  if (lowerMime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(lowerName)) return '照片';
  return '视频';
}

function buildUploadSections(reqMeta = {}) {
  const assetSpace = String(reqMeta.assetSpace || reqMeta.projectType || reqMeta.type || 'Projects').trim() || 'Projects';
  const root = safePathSegment(reqMeta.root || assetSpace, assetSpace);
  const category = safePathSegment(reqMeta.category || reqMeta.folder || reqMeta.subfolder || '默认分类', '默认分类');
  return [root, category];
}

function extractPosterTime(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return '00:00:00.12';
  const target = Math.min(Math.max(durationSeconds * 0.08, 0.12), Math.max(durationSeconds - 0.2, 0.12));
  const seconds = target.toFixed(2).padStart(5, '0');
  return `00:00:${seconds}`;
}

async function runFfmpegPosterExtract(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-ss',
      '00:00:00.12',
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-vf',
      'scale=1280:-2',
      '-q:v',
      '2',
      outputPath,
    ];
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', fail);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        if (!settled) {
          settled = true;
          resolve();
        }
        return;
      }
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      fail(new Error(`ffmpeg poster extraction exited with ${reason}${stderr ? `: ${stderr.slice(-500)}` : ''}`));
    });
    child.on('close', (code, signal) => {
      if (settled) return;
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      fail(new Error(`ffmpeg poster extraction closed with ${reason}${stderr ? `: ${stderr.slice(-500)}` : ''}`));
    });
  });
}

async function createVideoPoster(inputPath, uploadName, reqMeta = {}) {
  const tempPosterPath = path.join(path.dirname(inputPath), `${path.basename(uploadName, path.extname(uploadName)) || 'video'}-poster.jpg`);
  await runFfmpegPosterExtract(inputPath, tempPosterPath);
  const posterBuffer = await fs.readFile(tempPosterPath);
  const posterResult = await uploadFile(posterBuffer, path.basename(tempPosterPath), false, 'image/jpeg', {
    baseUrl: reqMeta.baseUrl,
    sections: [safePathSegment(reqMeta.root || reqMeta.assetSpace || reqMeta.type || 'Homepage', 'Homepage'), safePathSegment(reqMeta.category || reqMeta.folder || '首页封面', '首页封面')],
    displayName: safePathSegment(`${reqMeta?.displayName || path.basename(uploadName, path.extname(uploadName)) || 'video'} poster`, 'video-poster'),
    keepOriginalName: true,
  });
  await fs.rm(tempPosterPath, { force: true }).catch(() => {});
  return { posterUrl: posterResult.url || '', posterObjectName: posterResult.objectName || '', posterFileName: path.basename(tempPosterPath) };
}

export async function processVideoTask(taskId, originalName, buffer, reqMeta) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-video-'));
  const inputPath = path.join(tempDir, originalName || 'input');
  const outputPath = path.join(tempDir, `${path.basename(originalName, path.extname(originalName)) || 'video'}.mp4`);

  try {
    await updateVideoTranscodeTask(taskId, { status: 'processing' });
    await fs.writeFile(inputPath, buffer);
    const posterPromise = createVideoPoster(inputPath, originalName || 'video.mp4', reqMeta).catch(() => null);
    await runFfmpegTranscode(inputPath, outputPath);
    const uploadBuffer = await fs.readFile(outputPath);
    const uploadName = `${path.basename(originalName, path.extname(originalName)) || 'video'}.mp4`;
    const result = await uploadFile(uploadBuffer, uploadName, false, 'video/mp4', {
      baseUrl: reqMeta.baseUrl,
      sections: buildUploadSections(reqMeta, uploadName, 'video/mp4'),
      displayName: safePathSegment(reqMeta?.displayName || path.basename(uploadName, path.extname(uploadName)) || 'video', 'video'),
      keepOriginalName: true,
    });

    const poster = await posterPromise;
    await updateVideoTranscodeTask(taskId, {
      status: 'completed',
      targetUrl: result.url,
      posterUrl: poster?.posterUrl || null,
      posterObjectName: poster?.posterObjectName || null,
      posterFileName: poster?.posterFileName || null,
      errorMsg: null,
    });
    emitTaskEvent({ event: 'task-completed', taskId, status: 'completed', targetUrl: result.url, posterUrl: poster?.posterUrl || null, errorMsg: null });
  } catch (error) {
    const errorMsg = error?.message || 'transcode_failed';
    await updateVideoTranscodeTask(taskId, { status: 'failed', errorMsg });
    emitTaskEvent({ event: 'task-failed', taskId, status: 'failed', targetUrl: null, errorMsg });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
