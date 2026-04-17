import express from 'express';
import multer from 'multer';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { uploadFile } from '../utils/minio.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20480 * 1024 * 1024 } });

function isMovFile(file = {}) {
  const name = String(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  return name.endsWith('.mov') || mime === 'video/quicktime';
}

function runFfmpegTranscode(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      outputPath,
    ];

    const child = spawn('ffmpeg', args, { stdio: 'pipe' });
    let stderr = '';
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}${stderr ? `: ${stderr.slice(-500)}` : ''}`));
    });
  });
}

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const type = String(req.body?.type || 'public').toLowerCase();

    if (!file) {
      return res.status(400).json({ ok: false, message: 'file is required.' });
    }

    const isPrivate = type === 'private';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const publicBaseUrl = String(process.env.MINIO_PUBLIC_BASE_URL || process.env.PUBLIC_FILE_BASE_URL || '').trim();
    const forwardedHost = String(req.headers['x-forwarded-host'] || '').trim();
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim();
    const proxyBaseUrl = forwardedHost ? `${forwardedProto || req.protocol}://${forwardedHost}` : '';

    let uploadBuffer = file.buffer;
    let uploadName = file.originalname;
    let uploadMime = file.mimetype || 'application/octet-stream';
    let convertedFrom = '';

    if (isMovFile(file)) {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-mov-'));
      const inputPath = path.join(tempDir, file.originalname || 'input.mov');
      const outputPath = path.join(tempDir, `${path.basename(file.originalname, path.extname(file.originalname)) || 'video'}.mp4`);

      try {
        await fs.writeFile(inputPath, file.buffer);
        await runFfmpegTranscode(inputPath, outputPath);
        uploadBuffer = await fs.readFile(outputPath);
        uploadName = `${path.basename(file.originalname, path.extname(file.originalname)) || 'video'}.mp4`;
        uploadMime = 'video/mp4';
        convertedFrom = file.originalname;
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    }

    const result = await uploadFile(uploadBuffer, uploadName, isPrivate, uploadMime, {
      baseUrl: publicBaseUrl || proxyBaseUrl || baseUrl,
    });

    return res.status(201).json({
      ok: true,
      data: {
        ...result,
        fileType: uploadMime,
        fileName: uploadName,
        size: uploadBuffer.length,
        convertedFrom,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
