import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { filterFeaturedHomeItems, normalizeProjectList, splitFeaturedByMediaType } from './homeUtils.js';
import { HomeFeaturedSection, HomeHighlightsSection, HomeHeroSection, HomeStructureSection } from './HomeSections.jsx';

function Home() {
  const { locale, t } = useI18n();
  const highlights = t('home.highlights', {});
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchJson('/projects?page=home')
      .then((response) => setItems(filterFeaturedHomeItems(normalizeProjectList(response))))
      .catch(() => setItems([]));
  }, []);

  const { featuredImages, featuredVideos } = useMemo(() => splitFeaturedByMediaType(items), [items]);

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-20 text-zinc-100 md:px-10 md:pt-24">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <HomeHeroSection locale={locale} t={t} />
        <HomeHighlightsSection highlights={highlights} />
        <HomeFeaturedSection featuredImages={featuredImages} featuredVideos={featuredVideos} />
        <HomeStructureSection locale={locale} t={t} />
      </section>
    </main>
  );
}

export default Home;
