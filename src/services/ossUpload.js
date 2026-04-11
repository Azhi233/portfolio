const OSS_POLICY_API_BASE = (import.meta.env.VITE_OSS_POLICY_API_BASE || 'http://localhost:8787').replace(/\/$/, '');

/**
 * 请求后端生成 OSS 直传 Policy（不经你服务器转发文件）
 */
export async function requestOssPolicy({ fileName, contentType, dir }) {
  const response = await fetch(`${OSS_POLICY_API_BASE}/api/oss/policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, contentType, dir }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Policy request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();

  if (!data?.host || !data?.key || !data?.policy || !data?.signature || !data?.accessKeyId) {
    throw new Error('Invalid policy response from server');
  }

  return data;
}

/**
 * 执行浏览器直传 OSS
 * @returns {{url: string, key: string, host: string}}
 */
export async function uploadFileToOSS({ file, dir = 'uploads', onProgress }) {
  if (!(file instanceof File)) {
    throw new Error('Invalid file');
  }

  const policyData = await requestOssPolicy({
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    dir,
  });

  const formData = new FormData();
  formData.append('key', policyData.key);
  formData.append('OSSAccessKeyId', policyData.accessKeyId);
  formData.append('policy', policyData.policy);
  formData.append('Signature', policyData.signature);

  if (policyData.securityToken) {
    formData.append('x-oss-security-token', policyData.securityToken);
  }

  if (file.type) {
    formData.append('Content-Type', file.type);
  }

  formData.append('success_action_status', '204');
  formData.append('file', file);

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', policyData.host, true);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress?.(progress);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`OSS upload failed: ${xhr.status} ${xhr.responseText || ''}`));
      }
    };

    xhr.onerror = () => reject(new Error('OSS upload network error'));
    xhr.send(formData);
  });

  return {
    url: policyData.url,
    key: policyData.key,
    host: policyData.host,
  };
}
