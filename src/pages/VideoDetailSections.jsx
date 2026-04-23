import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import MediaPreview from '../components/MediaPreview.jsx';

export function VideoDetailHero({ video, ratio, onDetectRatio }) {
  const frameStyle = ratio ? { aspectRatio: ratio } : undefined;

  return (
    <section className="grid gap-6 md:grid-cols-12 md:items-center md:gap-10">
      <div className="md:col-span-4">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#b58e62]">Video Detail</p>
        <h1 className="mt-3 text-4xl font-light tracking-[0.04em] text-[#a97a4c] md:text-6xl">{video.title}</h1>
        <p className="mt-4 text-sm leading-7 text-[#75685b] md:text-base">{video.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="warning">{video.category || 'Video'}</Badge>
          {video.year ? <Badge tone="default">{video.year}</Badge> : null}
        </div>
      </div>

      <div className="md:col-span-8">
        <div className="overflow-hidden bg-black shadow-[0_30px_80px_rgba(0,0,0,0.10)] transition-transform duration-500 hover:-translate-y-1">
          <div className={`bg-black ${ratio ? '' : 'aspect-[16/10]'}`} style={frameStyle}>
            <MediaPreview
              src={video.videoUrl || video.poster}
              title={video.title}
              kind={video.videoUrl ? 'video' : 'image'}
              autoPlay={Boolean(video.videoUrl)}
              muted
              onVideoMetadata={({ width, height }) => onDetectRatio(width, height)}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function VideoMetaCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-[#d8c9b3]/55 bg-white/75 p-5 shadow-[0_18px_55px_rgba(148,120,82,0.08)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#b58e62]">{label}</p>
      <p className="mt-3 break-all text-sm leading-7 text-[#6f635a]">{value || '—'}</p>
    </div>
  );
}

export function VideoDetailShellLinks() {
  return <div className="mb-6 flex items-center justify-between border-b border-[#d8c9b3]/35 pb-4 text-[10px] uppercase tracking-[0.3em] text-[#b58e62]"><Link to="/" className="transition-opacity hover:opacity-60">Home</Link><div className="flex items-center gap-4"><Link to="/images" className="transition-opacity hover:opacity-60">Images</Link><Link to="/videos" className="transition-opacity hover:opacity-60">Videos</Link></div></div>;
}
