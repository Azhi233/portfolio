import HeroSection from '../../components/b2b-case-study/HeroSection.jsx';
import StrategySystem from '../../components/b2b-case-study/StrategySystem.jsx';
import AssetGallery from '../../components/b2b-case-study/AssetGallery.jsx';
import BusinessImpact from '../../components/b2b-case-study/BusinessImpact.jsx';

function B2BCaseStudyPage() {
  return (
    <main className="bg-primary-white text-slate-gray">
      <HeroSection />
      <StrategySystem />
      <AssetGallery />
      <BusinessImpact />
    </main>
  );
}

export default B2BCaseStudyPage;
