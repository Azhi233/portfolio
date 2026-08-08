import { getConfig, saveConfig } from './config.service.js';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toString(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeLinks(value) {
  const rawList = Array.isArray(value) ? value : [];
  return rawList
    .map((item, index) => {
      if (!isPlainObject(item)) return null;
      const label = toString(item.label || item.name || item.title, `Link ${index + 1}`);
      const url = toString(item.url || item.href || item.link);
      if (!url) return null;
      return { label, url };
    })
    .filter(Boolean);
}

export function normalizeAboutProfile(item, index = 0) {
  const source = isPlainObject(item) ? item : {};
  const contact = isPlainObject(source.contact) ? source.contact : {};

  return {
    id: toString(source.id, `about-profile-${index + 1}`),
    name: toString(source.name, `Profile ${String(index + 1).padStart(2, '0')}`),
    role: toString(source.role || source.title, ''),
    summary: toString(source.summary || source.bio, ''),
    portraitUrl: toString(source.portraitUrl || source.avatarUrl || source.imageUrl, ''),
    accent: toString(source.accent, ''),
    capabilities: toList(source.capabilities || source.skills || source.tags),
    experience: toList(source.experience || source.highlights),
    contact: {
      email: toString(source.contact?.email || source.email, ''),
      phone: toString(source.contact?.phone || source.phone, ''),
      wechat: toString(source.contact?.wechat || source.wechat, ''),
      location: toString(source.contact?.location || source.location, ''),
    },
    links: normalizeLinks(source.links),
    sortOrder: Number.isFinite(Number(source.sortOrder)) ? Number(source.sortOrder) : index,
    enabled: source.enabled !== false,
  };
}

export function normalizeAboutProfiles(value) {
  const rawList = Array.isArray(value)
    ? value
    : isPlainObject(value) && Array.isArray(value.profiles)
      ? value.profiles
      : isPlainObject(value) && Array.isArray(value.items)
        ? value.items
        : [];

  return rawList
    .map((item, index) => normalizeAboutProfile(item, index))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

export async function getAboutProfiles() {
  const config = await getConfig();
  return normalizeAboutProfiles(config?.['about-profiles'] || config?.aboutProfiles || []);
}

export async function saveAboutProfiles(payload) {
  const profiles = normalizeAboutProfiles(payload);
  const config = await saveConfig({ 'about-profiles': profiles });
  return normalizeAboutProfiles(config?.['about-profiles'] || profiles);
}
