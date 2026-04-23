import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

export async function processVideoTask(taskId, originalName, buffer, reqMeta) {
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
