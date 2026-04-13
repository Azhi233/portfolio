import { useMemo } from 'react';
import HeroReveal from '../../components/HeroReveal.jsx';
import BrandVideo from '../../components/BrandVideo.jsx';
import SocialGrid from '../../components/SocialGrid.jsx';
import AssetSwitch from '../../components/AssetSwitch.jsx';
import PortfolioBento from '../../components/PortfolioBento.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';

function inferType(url) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url || '') ? 'video' : 'image';
}

function parseModuleTag(description = '') {
  const text = String(description || '').toLowerCase();
  const match = text.match(/#module:([a-z0-9_-]+)/i);
  return match?.[1] || '';
}

function ToyProjectPage() {
  const { assets, projectData } = useConfig();
  const data = projectData?.toy_project;

  const projectAssets = useMemo(
    () =>
      (assets || []).filter((item) => item?.views?.project?.isActive && item?.views?.project?.projectId === 'toy_project'),
    [assets],
  );

  const orderedAssets = useMemo(() => {
    const urls = data?.modules?.assets?.assetUrls || [];
    if (!urls.length) return projectAssets;

    const byUrl = new Map(projectAssets.map((item) => [item.url, item]));
    return urls.map((url, index) => {
      const existing = byUrl.get(url);
      if (existing) return existing;
      return {
        id: `toy-module-${index}`,
        title: `Asset ${index + 1}`,
        url,
        type: inferType(url),
        views: { project: { description: '' } },
      };
    });
  }, [data?.modules?.assets?.assetUrls, projectAssets]);

  const moduleSlots = useMemo(() => {
    const slotMap = new Map();
    for (const item of orderedAssets) {
      const tag = parseModuleTag(item?.views?.project?.description);
      if (tag && !slotMap.has(tag)) {
        slotMap.set(tag, item);
      }
    }
    return slotMap;
  }, [orderedAssets]);

  const heroImages = {
    left:
      moduleSlots.get('hero-left')?.url ||
      orderedAssets[0]?.url ||
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=85',
    right:
      moduleSlots.get('hero-right')?.url ||
      orderedAssets[1]?.url ||
      'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=2200&q=85',
    merged:
      moduleSlots.get('hero-merged')?.url ||
      orderedAssets[2]?.url ||
      data?.coverUrl ||
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=85',
  };

  const videoAsset =
    moduleSlots.get('brand-video') ||
    orderedAssets.find((item) => item?.type === 'video' || inferType(item?.url) === 'video');

  const socialSource =
    orderedAssets.filter((item) => parseModuleTag(item?.views?.project?.description) === 'social').slice(0, 4);

  const socialItems = (socialSource.length > 0 ? socialSource : orderedAssets.slice(0, 4)).map((item, idx) => ({
    id: item.id || `social-${idx}`,
    title: item.title || `Social Asset ${idx + 1}`,
    type: item.type || inferType(item.url),
    url: item.url,
    poster: data?.coverUrl,
  }));

  const bentoItems = orderedAssets.slice(0, 6).map((item, idx) => ({
    id: item.id || `bento-${idx}`,
    title: item.title || `Portfolio ${idx + 1}`,
    image: item.url,
  }));

  const actionBullets = data?.modules?.action?.bullets || [];
  const reviewCards = data?.modules?.review?.cards || [];
  const showcase = data?.modules?.showcase || {};

  return (
    <main className="min-h-screen bg-[#050507] text-zinc-100">
      <HeroReveal
        images={heroImages}
        kicker={showcase.heroKicker || data?.subtitle || 'PRECISION VISUAL SYSTEM'}
        title={showcase.heroTitle || data?.title || 'COMMERCIAL IMPACT'}
      />
      <BrandVideo
        videoSrc={videoAsset?.url || 'https://cdn.coverr.co/videos/coverr-working-in-front-of-computer-1579/1080p.mp4'}
        poster={data?.coverUrl}
        captionTitle={showcase.brandCaptionTitle || data?.modules?.target?.headline || 'BRAND SCREENING ROOM'}
        captionSubtitle={showcase.brandCaptionSubtitle || data?.modules?.assets?.intro || 'A cinematic narrative that scales to every channel.'}
      />
      <SocialGrid
        items={
          socialItems.length > 0
            ? socialItems
            : (orderedAssets || []).filter((item) => parseModuleTag(item?.views?.project?.description) === 'social').slice(0, 4).map((item, idx) => ({
                id: item.id || `social-${idx}`,
                title: item.title || `Social Asset ${idx + 1}`,
                type: item.type || inferType(item.url),
                url: item.url,
                poster: data?.coverUrl,
              }))
        }
        heading={showcase.socialHeading || data?.modules?.action?.title || 'SOCIAL MATRIX DISTRIBUTION'}
        subheading={showcase.socialSubheading || actionBullets[1] || 'Short-form assets, engineered for feed dominance.'}
      />
      <AssetSwitch
        images={{
          raw: orderedAssets[0]?.url || data?.coverUrl,
          web: orderedAssets[3]?.url || orderedAssets[1]?.url || data?.coverUrl,
          print: orderedAssets[4]?.url || orderedAssets[2]?.url || data?.coverUrl,
        }}
        phaseCopy={{
          raw: showcase.assetPhaseRaw || data?.modules?.target?.summary || '原始高动态范围素材，保留最大后期空间与细节控制。',
          web: showcase.assetPhaseWeb || actionBullets[0] || '进入网页系统后，适配交互节奏、版式层级与加载性能。',
          print: showcase.assetPhasePrint || reviewCards[2]?.value || '转译为印刷物料，实现线下展陈与销售触点一致性。',
        }}
      />
      <PortfolioBento
        items={bentoItems}
        heading={showcase.bentoHeading || data?.modules?.review?.cards?.[0]?.title || 'FULL ECOSYSTEM PORTFOLIO'}
        subheading={showcase.bentoSubheading || data?.modules?.review?.cards?.[0]?.value || 'Explore the wider body of work.'}
      />
    </main>
  );
}

export default ToyProjectPage;
