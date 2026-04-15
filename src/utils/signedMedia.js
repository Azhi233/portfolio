const API_BASE = (import.meta.env.VITE_API_BASE || 'http://47.114.95.49:8787').replace(/\/$/, '');

const SIGNED_URL_REFRESH_BUFFER_MS = 30 * 60 * 1000;
const SIGNED_URL_PATTERN = /[?&]X-Amz-Expires=|[?&]X-Amz-Signature=|[?&]X-Amz-Credential=/i;

function parseExpiryFromUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    const expiresSeconds = parsed.searchParams.get('x-amz-expires') || parsed.searchParams.get('X-Amz-Expires');
    const dateValue = parsed.searchParams.get('x-amz-date') || parsed.searchParams.get('X-Amz-Date');
    if (!expiresSeconds || !dateValue) return 0;

    const year = Number(dateValue.slice(0, 4));
    const month = Number(dateValue.slice(4, 6)) - 1;
    const day = Number(dateValue.slice(6, 8));
    const hour = Number(dateValue.slice(9, 11));
    const minute = Number(dateValue.slice(11, 13));
    const second = Number(dateValue.slice(13, 15));
    const start = Date.UTC(year, month, day, hour, minute, second);
    return start + Number(expiresSeconds) * 1000;
  } catch {
    return 0;
  }
}

export function isSignedUrl(url = '') {
  return SIGNED_URL_PATTERN.test(String(url));
}

export function getUrlExpiry(url = '') {
  return parseExpiryFromUrl(String(url));
}

export function shouldRefreshUrl(url = '') {
  if (!isSignedUrl(url)) return false;
  const expiresAt = getUrlExpiry(url);
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - SIGNED_URL_REFRESH_BUFFER_MS;
}

export async function refreshSignedUrl(objectPath) {
  if (!objectPath) return '';
  const response = await fetch(`${API_BASE}/api/uploads/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: objectPath }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || 'Failed to refresh signed URL');
  }

  return payload?.data?.url || '';
}
