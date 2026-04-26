import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { filterFeaturedHomeItems, normalizeProjectList, splitFeaturedByMediaType } from './homeUtils.js';
import { HomeFeaturedSection, HomeHighlightsSection, HomeHeroSection, HomeStructureSection } from './HomeSections.jsx';

function Home() {
  const { t } = useI18n();
  const highlights = t('home.highlights', {});
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState({});

  useEffect(() => {
    fetchJson('/projects?page=home')
      .then((response) => setItems(filterFeaturedHomeItems(normalizeProjectList(response))))
      .catch(() => setItems([]));
    fetchJson('/config').then(setConfig).catch(() => setConfig({}));
  }, []);

  const { featuredImages, featuredVideos } = useMemo(() => splitFeaturedByMediaType(items), [items]);
  const homeVideoUrl = config?.homeVideoUrl || featuredVideos[0]?.videoUrl || featuredVideos[0]?.mainVideoUrl || '';
  const homeVideoTitle = config?.homeVideoTitle || featuredVideos[0]?.title || '';

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-20 text-zinc-100 md:px-10 md:pt-24">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <HomeHeroSection t={t} homeVideoUrl={homeVideoUrl} homeVideoTitle={homeVideoTitle} />
        <HomeHighlightsSection highlights={highlights} />
        <HomeFeaturedSection featuredImages={featuredImages} featuredVideos={featuredVideos} />
        <HomeStructureSection locale={t('locale', 'en')} t={t} />
      </section>
    </main>
  );
}

export default Home;
