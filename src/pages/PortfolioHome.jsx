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

    const unsubscribe = subscribePortfolioLayoutUpdates((next) => {
      if (mounted) setLayout(next);
    });

    loadProjects();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#FAF9F6] text-[#151515]">
      <MinimalTopNav />
      <PortfolioHero t={t} layout={layout} />
      <PortfolioWorkSection projects={projects} layout={layout} />
      <PortfolioFooter />
    </main>
  );
}

export default PortfolioHome;
