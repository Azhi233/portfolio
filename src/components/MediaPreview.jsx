function isVideoUrl(url = '') {
  const value = String(url).toLowerCase();
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/.test(value) || value.includes('video');
}

function isImageUrl(url = '') {
  const value = String(url).toLowerCase();
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/.test(value) || value.includes('image');
}

export default function MediaPreview({ src = '', title = '', className = '', muted = false, autoPlay = false, kind = '', onVideoMetadata = () => {} }) {
  if (!src) {
    return (
      <div className={`flex h-full min-h-[220px] items-center justify-center text-sm text-zinc-500 ${className}`.trim()}>
        No media assigned yet.
      </div>
    );
  }

  if (String(kind).startsWith('video') || isVideoUrl(src)) {
    return (
      <video
        className={`h-full w-full object-cover ${className}`.trim()}
        src={src}
        controls
        playsInline
        muted={muted}
        autoPlay={autoPlay}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          onVideoMetadata?.({ width: video.videoWidth, height: video.videoHeight, src });
        }}
      />
    );
  }

  if (isImageUrl(src)) {
    return <img className={`h-full w-full object-cover ${className}`.trim()} src={src} alt={title || 'Media preview'} />;
  }

  return (
    <iframe
      title={title || 'Media preview'}
      src={src}
      className={`h-full w-full ${className}`.trim()}
      allow="autoplay; fullscreen; picture-in-picture"
    />
  );
}
