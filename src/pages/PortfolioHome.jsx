import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import { fetchJson } from '../utils/api.js';
import { PortfolioFooter, PortfolioHero, PortfolioWorkSection } from './PortfolioHomeSections.jsx';
import { loadPortfolioLayout, subscribePortfolioLayoutUpdates } from './portfolioLayout.js';

function PortfolioHome() {
  const { t } = useI18n();
  const [layout, setLayout] = useState(null);
  const [projects, setProjects] = useState([]);
  const [homeVideo, setHomeVideo] = useState({ title: '', url: '' });

  useEffect(() => {
    let mounted = true;
    loadPortfolioLayout().then((next) => {
      if (mounted) setLayout(next);
    });

    const loadProjects = async () => {
      try {
        const items = await fetchJson('/projects');
        if (mounted) setProjects(Array.isArray(items) ? items : []);
      } catch {
        if (mounted) setProjects([]);
      }
    };

    const loadHomeVideo = async () => {
      try {
        const config = await fetchJson('/config');
        if (!mounted) return;
        setHomeVideo({
          title: config?.homeVideoTitle || '',
          url: config?.homeVideoUrl || '',
        });
      } catch {
        if (mounted) setHomeVideo({ title: '', url: '' });
      }
    };

    const unsubscribe = subscribePortfolioLayoutUpdates((next) => {
      if (mounted) setLayout(next);
    });

    loadProjects();
    loadHomeVideo();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#FAF9F6] text-[#151515]">
      <MinimalTopNav />
      <PortfolioHero t={t} layout={layout} homeVideo={homeVideo} />
      <PortfolioWorkSection projects={projects} layout={layout} />
      <PortfolioFooter />
    </main>
  );
}

export default PortfolioHome;
