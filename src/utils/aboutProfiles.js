const ABOUT_PROFILES_SYNC_KEY = 'portfolio.about.profiles.updated';
const ABOUT_PROFILES_SYNC_EVENT = 'portfolio-about-profiles-updated';
const ABOUT_PROFILES_LOCAL_KEY = 'portfolio.about.profiles.local';
const ABOUT_PROFILES_SEED_KEY = 'portfolio.about.profiles.seed';

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

const LOCAL_DEFAULT_PROFILES = [
  {
    id: 'about-profile-1',
    name: '王鸣笛',
    role: 'Visual Engineer / Commercial Photographer',
    summary: '专注商业摄影、视频制作与视觉策划，将品牌需求转化为克制、准确且具有传播力的影像。',
    portraitUrl: '/me.png',
    accent: 'warm',
    capabilities: ['Commercial Photography', 'Video Production', 'Visual Planning'],
    experience: ['独立工作室主理人', '企业内部视觉内容建设', '商业项目执行'],
    contact: {
      email: 'moses233@qq.com',
      phone: '+86 19314345676',
      wechat: 'zhiazhia233',
      location: 'China',
    },
    links: [{ label: 'Contact', url: '#contact' }],
    sortOrder: 0,
    enabled: true,
  },
  {
    id: 'about-profile-2',
    name: '示例人员 B',
    role: 'Creative Producer',
    summary: '用于本地闭环测试的第二张资料卡。你可以在后台编辑或删除它。',
    portraitUrl: '',
    accent: 'cool',
    capabilities: ['Creative Direction', 'Cross-media Delivery'],
    experience: ['项目统筹', '视觉资产管理'],
    contact: {
      email: 'example-b@example.com',
      phone: '',
      wechat: '',
      location: 'Shanghai',
    },
    links: [],
    sortOrder: 1,
    enabled: true,
  },
];

function readLocalProfiles() {
  if (typeof window === 'undefined') return LOCAL_DEFAULT_PROFILES;
  try {
    const raw = window.localStorage.getItem(ABOUT_PROFILES_LOCAL_KEY);
    if (!raw) return LOCAL_DEFAULT_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : LOCAL_DEFAULT_PROFILES;
  } catch {
    return LOCAL_DEFAULT_PROFILES;
  }
}

function writeLocalProfiles(profiles) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ABOUT_PROFILES_LOCAL_KEY, JSON.stringify(serializeAboutProfiles(profiles)));
  } catch {
    // ignore storage failures
  }
}

function hasServerSeed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ABOUT_PROFILES_SEED_KEY) === '1';
  } catch {
    return false;
  }
}

function markServerSeeded() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ABOUT_PROFILES_SEED_KEY, '1');
  } catch {
    // ignore
  }
}

export function getAboutProfilesLocalFallback() {
  return normalizeAboutProfiles(readLocalProfiles());
}

export function persistAboutProfilesLocalFallback(profiles) {
  writeLocalProfiles(profiles);
  return getAboutProfilesLocalFallback();
}

export function hasAboutProfilesServerSeed() {
  return hasServerSeed();
}

export function markAboutProfilesServerSeeded() {
  markServerSeeded();
}

export function broadcastAboutProfilesUpdate() {
  if (typeof window === 'undefined') return;
  const payload = String(Date.now());
  try {
    window.localStorage.setItem(ABOUT_PROFILES_SYNC_KEY, payload);
  } catch {
    // ignore storage failures
  }
  try {
    window.dispatchEvent(new CustomEvent(ABOUT_PROFILES_SYNC_EVENT, { detail: { at: payload } }));
  } catch {
    // ignore event failures
  }
}

export function subscribeAboutProfilesUpdates(handler) {
  if (typeof window === 'undefined') return () => {};
  const onCustom = () => handler?.();
  const onStorage = (event) => {
    if (event.key === ABOUT_PROFILES_SYNC_KEY || event.key === ABOUT_PROFILES_LOCAL_KEY) handler?.();
  };
  window.addEventListener(ABOUT_PROFILES_SYNC_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(ABOUT_PROFILES_SYNC_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export function subscribeAboutProfilesServerUpdates(handler) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return () => {};
  const source = new EventSource('/api/events');
  const onConfigUpdated = (event) => {
    try {
      const payload = JSON.parse(event.data || '{}');
      if (payload?.scope === 'aboutProfiles') {
        handler?.();
      }
    } catch {
      handler?.();
    }
  };
  source.addEventListener('config-updated', onConfigUpdated);
  return () => {
    source.removeEventListener('config-updated', onConfigUpdated);
    source.close();
  };
}

export function createEmptyAboutProfile(index = 0) {
  return {
    id: `about-profile-${Date.now()}-${index}`,
    name: `Profile ${String(index + 1).padStart(2, '0')}`,
    role: '',
    summary: '',
    portraitUrl: '',
    accent: '',
    capabilities: [],
    experience: [],
    contact: {
      email: '',
      phone: '',
      wechat: '',
      location: '',
    },
    links: [],
    sortOrder: index,
    enabled: true,
  };
}

export function normalizeAboutProfile(profile, index = 0) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const contact = source.contact && typeof source.contact === 'object' ? source.contact : {};
  const links = Array.isArray(source.links)
    ? source.links
        .map((item, linkIndex) => {
          if (!item || typeof item !== 'object') return null;
          const label = toString(item.label || item.name || item.title, `Link ${linkIndex + 1}`);
          const url = toString(item.url || item.href || item.link);
          if (!url) return null;
          return { label, url };
        })
        .filter(Boolean)
    : [];

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
      email: toString(contact.email || source.email, ''),
      phone: toString(contact.phone || source.phone, ''),
      wechat: toString(contact.wechat || source.wechat, ''),
      location: toString(contact.location || source.location, ''),
    },
    links,
    sortOrder: Number.isFinite(Number(source.sortOrder)) ? Number(source.sortOrder) : index,
    enabled: source.enabled !== false,
  };
}

export function normalizeAboutProfiles(value) {
  const rawList = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray(value.profiles)
      ? value.profiles
      : [];

  return rawList
    .map((item, index) => normalizeAboutProfile(item, index))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

export function serializeAboutProfiles(value) {
  return normalizeAboutProfiles(value).map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

export function aboutProfileToFormValue(profile, index = 0) {
  const item = profile && typeof profile === 'object' ? profile : createEmptyAboutProfile(index);
  return {
    ...createEmptyAboutProfile(index),
    ...item,
    id: toString(item.id, `about-profile-${Date.now()}-${index}`),
    name: toString(item.name, `Profile ${String(index + 1).padStart(2, '0')}`),
    role: toString(item.role, ''),
    summary: toString(item.summary, ''),
    portraitUrl: toString(item.portraitUrl, ''),
    accent: toString(item.accent, ''),
    capabilities: Array.isArray(item.capabilities) ? item.capabilities : toList(item.capabilities),
    experience: Array.isArray(item.experience) ? item.experience : toList(item.experience),
    contact: {
      email: toString(item.contact?.email, ''),
      phone: toString(item.contact?.phone, ''),
      wechat: toString(item.contact?.wechat, ''),
      location: toString(item.contact?.location, ''),
    },
    links: Array.isArray(item.links) ? item.links.map((link) => ({ label: toString(link?.label || link?.name || link?.title, ''), url: toString(link?.url || link?.href || link?.link, '') })).filter((link) => link.url) : [],
    sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
    enabled: item.enabled !== false,
  };
}

export function formValueToPayload(profile) {
  return normalizeAboutProfile(profile, Number.isFinite(Number(profile?.sortOrder)) ? Number(profile.sortOrder) : 0);
}
