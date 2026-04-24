import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import { PortfolioFooter, PortfolioHero, PortfolioWorkSection } from './PortfolioHomeSections.jsx';
import { loadPortfolioLayout, subscribePortfolioLayoutUpdates } from './portfolioLayout.js';

const FEATURED_PROJECTS = [
  { id: 'atelier-no-03', title: 'Atelier No. 03', subtitle: 'Editorial motion / product stills', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80' },
  { id: 'sequence-07', title: 'Sequence 07', subtitle: 'Cinematic brand portrait', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80' },
  { id: 'frame-study', title: 'Frame Study', subtitle: 'Quiet light / texture / rhythm', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80' },
];

function PortfolioHome() {
  const { t } = useI18n();
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    let mounted = true;
    loadPortfolioLayout().then((next) => {
      if (mounted) setLayout(next);
    });

    const unsubscribe = subscribePortfolioLayoutUpdates((next) => {
      if (mounted) setLayout(next);
    });

    return () => {
      mounted = false;
      unsubscribe?.();
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
