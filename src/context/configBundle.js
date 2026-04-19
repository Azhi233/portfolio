import { ASSETS_STORAGE_KEY, CONFIG_STORAGE_KEY, PROJECT_DATA_STORAGE_KEY, writeLocalJson } from './configStorage.js';
import { normalizeAsset, normalizeCaseStudies, normalizeProjectData } from './configNormalizers.js';

export function createBundleActions({
  getConfig,
  getAssets,
  getProjectData,
  setConfig,
  setAssets,
  setProjectData,
  persistConfigSnapshot,
  writePendingConfigPatch,
}) {
  const exportCmsBundle = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    payload: {
      config: getConfig(),
      assets: getAssets(),
      projectData: getProjectData(),
    },
  });

  const importCmsBundle = (bundle) => {
    const incoming = bundle?.payload || {};
    if (!incoming || typeof incoming !== 'object') return { ok: false, message: 'Invalid bundle payload.' };

    const nextConfig = incoming.config && typeof incoming.config === 'object'
      ? { ...getConfig(), ...incoming.config, caseStudies: normalizeCaseStudies(incoming.config.caseStudies || getConfig().caseStudies) }
      : getConfig();
    const nextAssets = Array.isArray(incoming.assets) ? incoming.assets.map(normalizeAsset) : getAssets();
    const nextProjectData = incoming.projectData && typeof incoming.projectData === 'object'
      ? normalizeProjectData(incoming.projectData)
      : getProjectData();

    setConfig(nextConfig);
    setAssets(nextAssets);
    setProjectData(nextProjectData);
    writeLocalJson(CONFIG_STORAGE_KEY, nextConfig);
    writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
    writeLocalJson(PROJECT_DATA_STORAGE_KEY, nextProjectData);
    writePendingConfigPatch?.(null);
    persistConfigSnapshot({ nextConfig, nextAssets, nextProjectData }).catch(() => {});
    return { ok: true, message: 'CMS bundle imported.' };
  };

  return { exportCmsBundle, importCmsBundle };
}
