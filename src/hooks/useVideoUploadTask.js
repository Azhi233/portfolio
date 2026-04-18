import { useEffect, useRef, useState } from 'react';

const UPLOAD_POLL_INTERVAL_MS = 1500;
const UPLOAD_POLL_TIMEOUT_MS = 180000;

function getApiBase() {
  return (import.meta.env.VITE_SERVER_URL || '').replace(/\/+$/, '');
}

export function useVideoUploadTask() {
  const [activeTask, setActiveTask] = useState(null);
  const eventSourceRef = useRef(null);
  const resolverRef = useRef(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const base = getApiBase();
    if (!base) return undefined;

    const eventSource = new EventSource(`${base}/api/events`);
    eventSourceRef.current = eventSource;

    const handleTaskEvent = (event) => {
      try {
        const payload = JSON.parse(event.data || '{}');
        if (!payload?.taskId) return;

        if (payload.status === 'completed') {
          if (resolverRef.current?.taskId === payload.taskId) {
            resolverRef.current.resolve(payload);
            resolverRef.current = null;
          }
          setActiveTask((prev) => (prev?.taskId === payload.taskId ? { ...prev, status: 'completed', targetUrl: payload.targetUrl || payload.url || '' } : prev));
          return;
        }

        if (payload.status === 'failed') {
          if (resolverRef.current?.taskId === payload.taskId) {
            resolverRef.current.reject(new Error(payload.errorMsg || 'transcode_failed'));
            resolverRef.current = null;
          }
          setActiveTask((prev) => (prev?.taskId === payload.taskId ? { ...prev, status: 'failed', errorMsg: payload.errorMsg || 'transcode_failed' } : prev));
          return;
        }

        if (payload.status === 'processing') {
          setActiveTask((prev) => (prev?.taskId === payload.taskId ? { ...prev, status: 'processing' } : prev));
        }
      } catch {
        // ignore malformed payload
      }
    };

    eventSource.addEventListener('task-started', handleTaskEvent);
    eventSource.addEventListener('task-failed', handleTaskEvent);
    eventSource.addEventListener('task-completed', handleTaskEvent);
    eventSource.addEventListener('task-updated', handleTaskEvent);

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, []);

  const waitForTask = async (taskId) => {
    const base = getApiBase();
    const startedAt = Date.now();

    while (Date.now() - startedAt < UPLOAD_POLL_TIMEOUT_MS) {
      if (!base) break;
      const response = await fetch(`${base}/api/uploads/status/${taskId}`, { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        const task = payload?.data || {};
        if (task.status === 'completed' || task.status === 'failed') return task;
      }
      await new Promise((resolve) => window.setTimeout(resolve, UPLOAD_POLL_INTERVAL_MS));
    }

    throw new Error('视频转码超时，请稍后重试。');
  };

  const trackTask = (task) => {
    setActiveTask(task);
  };

  const uploadVideo = async (file) => {
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;

    const base = getApiBase();
    if (!base) {
      throw new Error('缺少 API 基址');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dir', 'videos/main');
    formData.append('type', 'public');

    const response = await fetch(`${base}/api/uploads`, {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    const taskId = String(payload?.data?.taskId || '').trim();
    if (response.status !== 202 || !taskId) {
      throw new Error(payload?.message || `Upload failed: ${response.status}`);
    }

    const waitingTask = {
      taskId,
      status: 'processing',
      progress: 0,
      fileName: file.name || '',
      fileType: file.type || '',
      convertedFrom: '',
      url: '',
    };
    setActiveTask(waitingTask);

    const taskResult = await new Promise((resolve, reject) => {
      resolverRef.current = { taskId, resolve, reject };
      waitForTask(taskId).then(resolve).catch(reject);
    });

    if (requestSeqRef.current !== seq) {
      throw new Error('Upload superseded');
    }

    const finalUrl = String(taskResult?.targetUrl || taskResult?.url || '').trim();
    if (!finalUrl) {
      throw new Error('转码完成但未返回最终视频地址。');
    }

    const completedTask = {
      taskId,
      status: 'completed',
      progress: 100,
      fileName: taskResult.fileName || file.name || '',
      fileType: taskResult.fileType || 'video/mp4',
      convertedFrom: taskResult.convertedFrom || file.name || '',
      url: finalUrl,
    };
    setActiveTask(completedTask);
    return completedTask;
  };

  const awaitTask = (taskId) =>
    new Promise((resolve, reject) => {
      resolverRef.current = { taskId, resolve, reject };
      waitForTask(taskId).then(resolve).catch(reject);
    });

  return {
    activeTask,
    trackTask,
    awaitTask,
    uploadVideo,
  };
}
