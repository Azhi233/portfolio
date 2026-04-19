import { ASSETS_STORAGE_KEY, writeLocalJson } from './configStorage.js';
import { normalizeAsset } from './configNormalizers.js';

export function createAssetActions({ setAssets, persistConfigSnapshot, createId }) {
  const saveAssetsToServer = (nextAssets) => {
    writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
    persistConfigSnapshot({ nextAssets }).catch((error) => console.error('Failed to persist assets:', error));
  };

  const addAsset = (assetInput) => {
    setAssets((prev) => {
      const nextAssets = [...prev, normalizeAsset({ ...assetInput, id: createId('asset') })];
      saveAssetsToServer(nextAssets);
      return nextAssets;
    });
  };

  const addAssets = (assetInputs) => {
    setAssets((prev) => {
      const createdAssets = Array.isArray(assetInputs) ? assetInputs.map((assetInput) => normalizeAsset({ ...assetInput, id: createId('asset') })) : [];
      const nextAssets = [...prev, ...createdAssets];
      saveAssetsToServer(nextAssets);
      return nextAssets;
    });
  };

  const updateAsset = (assetId, updates) => {
    setAssets((prev) => {
      const nextAssets = prev.map((asset) => (asset.id === assetId ? normalizeAsset({ ...asset, ...updates }) : asset));
      saveAssetsToServer(nextAssets);
      return nextAssets;
    });
  };

  const deleteAsset = (assetId) => {
    setAssets((prev) => {
      const nextAssets = prev.filter((asset) => asset.id !== assetId);
      saveAssetsToServer(nextAssets);
      return nextAssets;
    });
  };

  return { addAsset, addAssets, updateAsset, deleteAsset };
}
