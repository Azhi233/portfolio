import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import EditableMedia from './EditableMedia.jsx';
import { useIntrinsicMediaSize } from '../hooks/useIntrinsicMediaSize.jsx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function BrandVideo({ videoSrc, poster, captionTitle, captionSubtitle, statusLabel }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const intrinsic = useIntrinsicMediaSize();
  const ratio = intrinsic.aspectRatio;
  const mediaHeight = ratio ? `min(80vh, calc(100vw / ${ratio}))` : '80vh';

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      const video = videoRef.current;
      const playVideo = () => {
        if (!video) return;
        const playPromise = video.play();
        if (playPromise?.catch) playPromise.catch(() => {});
      };

      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          if (self.progress > 0.05 && self.progress < 0.95) {
            playVideo();
          }
        },
      });

      mm.add('(min-width: 768px)', () => {
        gsap.to('.brand-video-layer', {
          y: '20%',
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      mm.add('(max-width: 767px)', () => {
        gsap.to('.brand-video-layer', {
          y: '10%',
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      gsap.fromTo(
        '.brand-caption',
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.brand-caption',
            start: 'top 72%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      return () => {
        st.kill();
        mm.revert();
      };
    },
    { scope: rootRef, revertOnUpdate: true },
  );

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-black" style={{ height: mediaHeight }}>
      <EditableMedia
        type="video"
        src={videoSrc}
        className="brand-video-layer h-full w-full object-cover"
        style={{ height: '100%', width: '100%' }}
        onLoadedMetadata={intrinsic.onVideoLoadedMetadata}
        onChange={() => {}}
        onDoubleClick={() => {
          if (!videoRef.current) return;
          const playPromise = videoRef.current.play();
          if (playPromise?.catch) playPromise.catch(() => {});
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/30" />

      <div className="brand-caption absolute left-1/2 top-1/2 z-10 w-[88vw] max-w-2xl -translate-x-1/2 rounded-2xl border border-white/20 bg-black/45 p-6 backdrop-blur-sm md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs tracking-[0.26em] text-zinc-400">{captionTitle}</p>
          {statusLabel ? (
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[10px] tracking-[0.12em] text-emerald-200">
              {statusLabel}
            </span>
          ) : null}
        </div>
        <h2 className="mt-3 text-2xl tracking-[0.1em] text-zinc-100 md:text-4xl">{captionSubtitle}</h2>
      </div>
    </section>
  );
}

export default BrandVideo;
