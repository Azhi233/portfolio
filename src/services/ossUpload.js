const LOCAL_API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8787').replace(/\/$/, '');

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
export async function uploadFileToOSS({ file, dir = 'uploads', onProgress }) {
  if (!(file instanceof File)) {
    throw new Error('Invalid file');
  }

  onProgress?.(10);
  const data = await fileToDataUrl(file);
  onProgress?.(60);

  const response = await fetch(`${LOCAL_API_BASE}/api/uploads/local`, {
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

  onProgress?.(100);

  return payload;
}
