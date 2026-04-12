import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function safeFileName(value) {
  return String(value || 'image').replace(/[\\/:*?"<>|]/g, '_');
}

export async function downloadImagesAsZip({ items, projectName, onProgress }) {
  const normalized = Array.isArray(items) ? items.filter((item) => item?.url) : [];
  if (normalized.length === 0) {
    throw new Error('没有可下载的图片。');
  }

  const zip = new JSZip();

  for (let i = 0; i < normalized.length; i += 1) {
    const item = normalized[i];
    onProgress?.({ current: i + 1, total: normalized.length, label: `正在获取图片 ${i + 1}/${normalized.length}...` });

    const response = await fetch(item.url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`图片下载失败：${item.url}`);
    }

    const blob = await response.blob();
    const ext = blob.type?.split('/')[1] || 'jpg';
    const fileName = `${safeFileName(item.fileName || `image-${i + 1}`)}.${ext}`;
    zip.file(fileName, blob);
  }

  onProgress?.({ current: normalized.length, total: normalized.length, label: '正在打包 ZIP...' });
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipName = `${safeFileName(projectName || '项目')}-高清交付.zip`;
  saveAs(zipBlob, zipName);
  onProgress?.({ current: normalized.length, total: normalized.length, label: '下载已开始。' });
}
