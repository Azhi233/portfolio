const LOCAL_API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8787/api' : 'http://47.114.95.49/api')).replace(/\/+$/, '');
const SIGNED_URL_REFRESH_BUFFER_MS = 60 * 1000;
const UPLOAD_TIMEOUT_MS = 60 * 60 * 1000;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 上传文件到本地服务器，由后端落盘到 /uploads
 * @returns {{url: string, path: string, size?: number, contentType?: string, fileName?: string}}
 */
async function refreshSignedUrl(path) {
  const response = await fetch(`${LOCAL_API_BASE}/uploads/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Refresh signed url failed: ${response.status} ${detail}`);
  }

  const result = await response.json();
  return result?.data?.url || '';
}

export async function uploadFileToOSS({ file, dir = 'uploads', onProgress }) {
  if (!(file instanceof File)) {
    throw new Error('Invalid file');
  }

  onProgress?.(10);
  const data = await fileToDataUrl(file);
  onProgress?.(60);

  const response = await fetch(`${LOCAL_API_BASE}/uploads/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      dir,
      data,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Local upload failed: ${response.status} ${detail}`);
  }

  const result = await response.json();
  const payload = result?.data;

  if (!payload?.url) {
    throw new Error('Invalid local upload response');
  }

  const expiresInSeconds = Number(payload?.expiresInSeconds || 0);
  const expiresAt = expiresInSeconds > 0 ? Date.now() + expiresInSeconds * 1000 : 0;

  onProgress?.(100);

  return {
    ...payload,
    expiresAt,
    async refreshUrl() {
      if (!payload?.path) return payload.url;
      const nextUrl = await refreshSignedUrl(payload.path);
      if (!nextUrl) throw new Error('Failed to refresh signed url');
      payload.url = nextUrl;
      payload.expiresAt = expiresAt > 0 ? Date.now() + expiresInSeconds * 1000 : 0;
      return nextUrl;
    },
    isExpiringSoon() {
      return expiresAt > 0 && Date.now() >= expiresAt - SIGNED_URL_REFRESH_BUFFER_MS;
    },
  };
}
