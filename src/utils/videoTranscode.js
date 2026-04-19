import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();
let loadPromise = null;

function getFileExtension(name = '') {
  const match = String(name).match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

function buildOutputName(fileName = 'video') {
  const baseName = String(fileName).replace(/\.[^.]+$/, '') || 'video';
  return `${baseName}.mp4`;
}

export function isVideoFile(file) {
  return Boolean(file && file.type && file.type.startsWith('video/'));
}

async function ensureFfmpeg() {
  if (!loadPromise) {
    loadPromise = ffmpeg.load();
  }
  await loadPromise;
}

export async function transcodeVideoToMp4(file, onProgress) {
  if (!isVideoFile(file)) {
    return { file, converted: false };
  }

  const extension = getFileExtension(file.name);
  const alreadyMp4 = file.type === 'video/mp4' || extension === 'mp4';
  if (alreadyMp4) {
    return { file, converted: false };
  }

  await ensureFfmpeg();
  const inputName = file.name || 'input-video';
  const outputName = buildOutputName(inputName);

  if (typeof onProgress === 'function') {
    ffmpeg.off?.('progress');
    ffmpeg.on('progress', ({ progress }) => onProgress(Math.round((Number(progress) || 0) * 100)));
  }

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    '-i',
    inputName,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  const outputFile = new File([data], outputName, { type: 'video/mp4' });

  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch {
    // ignore cleanup failures
  }

  return { file: outputFile, converted: true };
}
