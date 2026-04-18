import { useMemo } from 'react';

export function useAssetCollections({ assets, assetFilterMode }) {
  const filteredAssetsForPanel = useMemo(() => {
    return (assets || []).filter((asset) => {
      const inExpertise = Boolean(asset.views?.expertise?.isActive);
      const inProject = Boolean(asset.views?.project?.isActive);
      if (assetFilterMode === 'all') return true;
      if (assetFilterMode === 'expertise_only') return inExpertise && !inProject;
      if (assetFilterMode === 'project_only') return !inExpertise && inProject;
      if (assetFilterMode === 'both') return inExpertise && inProject;
      return true;
    });
  }, [assets, assetFilterMode]);

  const videoWorkAssets = useMemo(
    () => (assets || []).filter((asset) => asset?.mediaGroup === 'video' || asset?.type === 'video'),
    [assets],
  );

  const photoWorkAssets = useMemo(
    () => (assets || []).filter((asset) => asset?.mediaGroup === 'photo' || (asset?.mediaGroup !== 'video' && asset?.type !== 'video')),
    [assets],
  );

  return {
    filteredAssetsForPanel,
    videoWorkAssets,
    photoWorkAssets,
  };
}
