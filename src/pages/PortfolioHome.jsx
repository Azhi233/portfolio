import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import MediaFrame from '../components/MediaFrame.jsx';
import { PortfolioFooter, PortfolioHero } from './PortfolioHomeSections.jsx';
import { loadPortfolioLayout } from './portfolioLayout.js';

const FEATURED_PROJECTS = [
  { id: 'atelier-no-03', title: 'Atelier No. 03', subtitle: 'Editorial motion / product stills', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80' },
  { id: 'sequence-07', title: 'Sequence 07', subtitle: 'Cinematic brand portrait', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80' },
  { id: 'frame-study', title: 'Frame Study', subtitle: 'Quiet light / texture / rhythm', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80' },
];

function PortfolioWorkSection({ projects, layout }) {
  return (
    <section id="work" className="bg-[#FAF9F6] px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#151515]/45">Selected Work</p>
            <h2 className="mt-3 text-2xl font-light tracking-[0.08em] md:text-4xl">Projects</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#151515]/55">The front page now reads the same layout payload as the editor, so preview and publish stay aligned.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project, index) => {
            const slot = layout?.slots?.[index] || {};
            const media = slot.mediaUrl ? slot : { mediaUrl: project.image, mediaType: 'image', aspectRatio: '4 / 5', cropX: 50, cropY: 50, scale: 1 };
            return (
              <a key={project.id} href="/" className="pointer-events-auto group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1">
                <MediaFrame
                  src={media.mediaUrl}
                  alt={project.title}
                  type={media.mediaType}
                  aspectRatio={media.aspectRatio}
                  cropX={media.cropX}
                  cropY={media.cropY}
                  scale={media.scale}
                  className="bg-black/5"
                />
                <div className="p-6 md:p-8"><h3 className="text-xl font-light tracking-[0.08em] md:text-2xl">{project.title}</h3><p className="mt-2 text-sm leading-7 text-[#151515]/55">{project.subtitle}</p></div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PortfolioHome() {
  const { t } = useI18n();
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    let mounted = true;
    loadPortfolioLayout().then((next) => {
      if (mounted) setLayout(next);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#FAF9F6] text-[#151515]">
      <MinimalTopNav />
      <PortfolioHero t={t} layout={layout} />
      <PortfolioWorkSection projects={FEATURED_PROJECTS} layout={layout} />
      <PortfolioFooter />
    </main>
  );
}

export default PortfolioHome;
