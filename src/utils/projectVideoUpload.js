import { fetchJson, uploadFile } from './api.js';
import { transcodeVideoToMp4 } from './videoTranscode.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFileKind(file) {
  return file?.type?.startsWith('video/') ? 'video' : 'image';
}

async function waitForTask(taskId, onStatus) {
  let delayMs = 1200;
  let lastStatus = '';

  while (true) {
    const task = await fetchJson(`/uploads/status/${taskId}`);
    const status = String(task?.status || '').toLowerCase();
    const message = task?.errorMsg || task?.targetUrl || status;

    if (status !== lastStatus) {
      onStatus?.({ stage: 'writing-back', status, message, task });
      lastStatus = status;
    }

    if (status === 'completed') return task;
    if (status === 'failed') throw new Error(task?.errorMsg || 'Video transcode failed.');

    await sleep(delayMs);
    delayMs = Math.min(delayMs * 1.35, 4000);
  }
}

export async function uploadMediaAsset(file, { type = 'public', onProgress, onStage } = {}) {
  if (!file) throw new Error('File is required.');

  const kind = getFileKind(file);
  onStage?.({ stage: 'preparing', kind, fileName: file.name, progress: 0 });

  if (kind !== 'video') {
    const result = await uploadFile(file, type, (event) => {
      const total = Number(event?.total || file.size || 0);
      const loaded = Number(event?.loaded || 0);
      const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
      onProgress?.({ stage: 'uploading', progress, fileName: file.name, kind });
    });

    return { result, file, kind, converted: false };
  }

  onStage?.({ stage: 'transcoding', kind, fileName: file.name, progress: 0 });
  const transcoded = await transcodeVideoToMp4(file, (progress) => {
    onProgress?.({ stage: 'transcoding', progress, fileName: file.name, kind });
  });

  const uploadFileObject = transcoded.file || file;
  onStage?.({ stage: 'uploading-source', kind, fileName: uploadFileObject.name, progress: 0 });
  const initial = await uploadFile(uploadFileObject, type, (event) => {
    const total = Number(event?.total || uploadFileObject.size || 0);
    const loaded = Number(event?.loaded || 0);
    const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
    onProgress?.({ stage: 'uploading-source', progress, fileName: uploadFileObject.name, kind });
  });

  if (initial?.status === 'processing' && initial?.taskId) {
    const task = await waitForTask(initial.taskId, onStage);
    return {
      result: { ...initial, ...task, url: task?.targetUrl || initial?.url },
      file: uploadFileObject,
      kind,
      converted: true,
    };
  }

  onStage?.({ stage: 'writing-back', kind, fileName: uploadFileObject.name, progress: 100, status: 'completed' });
  return { result: initial, file: uploadFileObject, kind, converted: transcoded.converted };
}
