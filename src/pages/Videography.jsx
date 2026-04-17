import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import OgilvyGalleryGrid from '../components/OgilvyGalleryGrid.jsx';
import EditableText from '../components/EditableText.jsx';
import EditableMedia from '../components/EditableMedia.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useIntrinsicMediaSize } from '../hooks/useIntrinsicMediaSize.jsx';
import { videoCategories, videos as fallbackVideos } from '../data/videoData.js';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80';

function inferMediaGroup(asset = {}) {
  const type = String(asset?.type || '').toLowerCase();
  const url = String(asset?.url || asset?.videoUrl || '').toLowerCase();
  if (asset?.mediaGroup === 'video' || type === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/.test(url)) return 'video';
  return 'photo';
}

function Videography() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const heroMedia = useIntrinsicMediaSize();
  const { config, updateConfig, assets } = useConfig();

  const videoWorks = useMemo(() => (assets || []).filter((asset) => inferMediaGroup(asset) === 'video'), [assets]);
  const fallbackVideoWorks = useMemo(() => fallbackVideos, []);

  const filteredVideos = useMemo(() => {
    const source = videoWorks.length > 0 ? videoWorks : fallbackVideoWorks.map((video) => ({
      id: video.id,
      title: video.title,
      category: video.category,
      subTitle: video.subTitle,
      coverUrl: video.cover,
      videoUrl: video.videoUrl,
      priority: 0,
    }));
    if (activeFilter === 'ALL') return source;
    return source.filter((video) => video.category === activeFilter || inferMediaGroup(video) === 'video');
  }, [activeFilter, videoWorks, fallbackVideoWorks]);

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <EditableText as="p" className="text-xs tracking-[0.2em] text-zinc-500" value={config.videoKicker || 'CATEGORY'} onChange={(value) => updateConfig('videoKicker', value)} />
        <EditableText as="h1" className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl" value={config.videoTitle || 'VIDEOGRAPHY'} onChange={(value) => updateConfig('videoTitle', value)} />
        <EditableText as="p" className="mt-3 text-xs tracking-[0.14em] text-zinc-500" value={config.videoSubtitle || `MOTION WORKS · ${filteredVideos.length}`} onChange={(value) => updateConfig('videoSubtitle', value)} />

        <motion.div layout className="mt-7 flex flex-wrap gap-2 md:gap-3">
          {videoCategories.map((category) => {
            const active = activeFilter === category.id;
            return (
              <motion.button
                key={category.id}
                type="button"
                onClick={() => setActiveFilter(category.id)}
                whileTap={{ scale: 0.97 }}
                className={`rounded-full border px-4 py-2 text-xs tracking-[0.12em] transition ${
                  active
                    ? 'border-zinc-100 bg-zinc-100/10 text-zinc-100'
                    : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {category.label}
              </motion.button>
            );
          })}
        </motion.div>

        <div className="mt-8 rounded-3xl border border-white/8 bg-zinc-950/35 p-2.5 backdrop-blur-sm md:p-4">
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <h2 className="font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-3xl">
              {videoCategories.find((item) => item.id === activeFilter)?.subtitle || '全部视频作品'}
            </h2>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black/25" style={{ aspectRatio: heroMedia.aspectRatio || '16 / 9' }}>
            <EditableMedia
              type="video"
              src={filteredVideos[0]?.url || filteredVideos[0]?.videoUrl || filteredVideos[0]?.coverUrl || ''}
              className="h-full w-full object-cover"
              onLoadedMetadata={heroMedia.onVideoLoadedMetadata}
              onChange={(value) => updateConfig('videoHeroUrl', value)}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.16 } }}
            >
              <OgilvyGalleryGrid
                items={filteredVideos.map((video, index) => ({
                  id: video.id,
                  title: video.title,
                  coverUrl: video.coverUrl || video.cover || FALLBACK_COVER,
                  tagline: video.subTitle || video.title,
                  category: video.category || 'VIDEO',
                  to: video.url || video.videoUrl || '/',
                  span: video.priority >= 90 ? 'wide' : video.priority >= 70 ? 'tall' : index === 0 ? 'wide-soft' : '',
                  priority: video.priority || 0,
                  width: video.coverWidth,
                  height: video.coverHeight,
                  aspectRatio: video.coverAspectRatio,
                  statusLabel: '视频页',
                  statusTone: 'video',
                }))}
              />
            </motion.div>
          </AnimatePresence>

          {filteredVideos.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-10 text-center text-xs tracking-[0.16em] text-zinc-500">
              NO MATCHING VIDEO WORKS IN THIS FILTER.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default Videography;
