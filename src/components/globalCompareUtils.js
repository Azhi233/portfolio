const VARIANT_ORDER = ['raw', 'graded', 'styled'];
const VARIANT_LABELS = {
  raw: 'RAW',
  graded: 'GRADED',
  styled: 'STYLED',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getVariantKeys(asset) {
  const variants = asset?.variants && typeof asset.variants === 'object' ? asset.variants : {};
  const known = VARIANT_ORDER.filter((key) => typeof variants[key] === 'string' && variants[key].trim());
  const extra = Object.keys(variants).filter(
    (key) => !known.includes(key) && typeof variants[key] === 'string' && variants[key].trim(),
  );
  return [...known, ...extra];
}

function pickDefaultKey(asset, keys) {
  const variants = asset?.variants || {};
  if (keys.includes('graded') && variants.graded) return 'graded';
  if (keys.includes('raw') && variants.raw) return 'raw';
  if (keys.includes('styled') && variants.styled) return 'styled';
  return keys[0] || 'default';
}

export { VARIANT_LABELS, clamp, getVariantKeys, pickDefaultKey };
