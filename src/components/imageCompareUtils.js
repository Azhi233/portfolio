const VARIANT_ORDER = ['raw', 'graded', 'styled'];

function isValidUrl(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getImageVariantKeys(variants) {
  const safeVariants = variants && typeof variants === 'object' ? variants : {};
  const known = VARIANT_ORDER.filter((key) => isValidUrl(safeVariants[key]));
  const extra = Object.keys(safeVariants).filter((key) => !known.includes(key) && isValidUrl(safeVariants[key]));
  return [...known, ...extra];
}

function getCoverSource(asset) {
  const variants = asset?.variants && typeof asset.variants === 'object' ? asset.variants : {};
  return variants.graded || variants.raw || variants.styled || asset?.url || '';
}

function canCompareAsset(asset, variantKeys) {
  return variantKeys.length >= 2 || asset?.type === 'image-comparison';
}

export { isValidUrl, getImageVariantKeys, getCoverSource, canCompareAsset };
