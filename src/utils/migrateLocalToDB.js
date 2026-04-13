const API_BASE = '/api';

const DIRECTOR_CONFIG_KEYS = {
  'director.config.v2': 'config',
  'director.assets.v1': 'assets',
  'director.projectData.v1': 'projectData',
  'director.deliveryUnlocks.v1': 'deliveryUnlocks',
  'director.projectUnlocks.v1': 'projectUnlocks',
  'director.reviews.v1': 'reviews',
  'director.reviews.audit.v1': 'reviewAuditLogs',
};

function safeParse(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload?.data;
}

export async function migrateLocalToDB() {
  if (typeof window === 'undefined') {
    throw new Error('migrateLocalToDB can only run in browser environment.');
  }

  const configPayload = {};
  const projects = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith('director.')) continue;

    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    if (key === 'director.projects.v1') {
      const parsedProjects = safeParse(raw, []);
      if (Array.isArray(parsedProjects)) {
        projects.push(...parsedProjects);
      }
      continue;
    }

    const mappedKey = DIRECTOR_CONFIG_KEYS[key];
    if (!mappedKey) continue;
    configPayload[mappedKey] = safeParse(raw, null);
  }

  await requestJson('/config', {
    method: 'POST',
    body: JSON.stringify(configPayload),
  });

  for (const project of projects) {
    const id = project?.id;
    if (!id) continue;

    try {
      await requestJson('/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      });
    } catch {
      await requestJson(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(project),
      });
    }
  }

  return {
    ok: true,
    migratedConfigKeys: Object.keys(configPayload),
    migratedProjectCount: projects.length,
  };
}
