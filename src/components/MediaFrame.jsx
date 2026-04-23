function normalizeAspectRatio(value, fallback = '4 / 3') {
  const text = String(value || fallback).trim();
  if (!text) return fallback;
  if (text.includes('/')) return text;
  if (text.includes(':')) return text.replace(':', ' / ');
  return fallback;
}

export default function MediaFrame({
  src,
  alt = '',
  type = 'image',
  aspectRatio = '4 / 3',
  cropX = 50,
  cropY = 50,
  scale = 1,
  frameScale = 1,
  className = '',
}) {
  const ratio = normalizeAspectRatio(aspectRatio);
  const objectPosition = `${Number.isFinite(Number(cropX)) ? Number(cropX) : 50}% ${Number.isFinite(Number(cropY)) ? Number(cropY) : 50}%`;
  const transform = `scale(${Number.isFinite(Number(scale)) ? Number(scale) : 1})`;
  const containerTransform = `scale(${Number.isFinite(Number(frameScale)) ? Number(frameScale) : 1})`;

  return (
    <div className={`overflow-hidden ${className}`} style={{ aspectRatio: ratio, transform: containerTransform, transformOrigin: 'center center' }}>
      {type === 'video' ? (
        <video src={src} className="h-full w-full object-cover" style={{ objectPosition }} muted playsInline loop autoPlay />
      ) : (
        <img src={src} alt={alt} className="h-full w-full object-cover" style={{ objectPosition, transform }} />
      )}
    </div>
  );
}
