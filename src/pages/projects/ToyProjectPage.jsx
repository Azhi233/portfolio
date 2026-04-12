import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext.jsx';
import { useState } from 'react';
import GlobalCompareModal from '../../components/GlobalCompareModal.jsx';
import ImageCompareCard from '../../components/ImageCompareCard.jsx';
import ProjectCTA from '../../components/ProjectCTA.jsx';

const FALLBACK_MEDIA = [
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1800&q=80',
    alt: 'Toy hero visual',
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80',
    alt: 'Toy detail',
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Toy mood',
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Toy scene',
  },
];

function inferType(url) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url) ? 'video' : 'image';
}

function getProjectAssets(assets, projectId, assetUrls) {
  const fromViews = (assets || []).filter((asset) => asset?.views?.project?.isActive && asset?.views?.project?.projectId === projectId);
  const byUrl = new Map(fromViews.map((item) => [item.url, item]));

  const orderedFromModule = (assetUrls || []).map((url, index) => {
    const found = byUrl.get(url);
    if (found) return found;
    return {
      id: `${projectId}-module-${index}`,
      url,
      title: `Asset ${index + 1}`,
      type: inferType(url),
      views: { project: { description: '' } },
    };
  });

  const merged = [...orderedFromModule, ...fromViews.filter((item) => !(assetUrls || []).includes(item.url))];
  return merged.length > 0
    ? merged
    : FALLBACK_MEDIA.map((item, idx) => ({
        id: `${projectId}-fallback-${idx}`,
        title: `Fallback ${idx + 1}`,
        url: item.url,
        type: item.type,
        views: { project: { description: '' } },
      }));
}

function MediaCell({ item, className = '', onOpenCompare }) {
  if (item.type === 'image-comparison') {
    return (
      <div className="relative">
        <ImageCompareCard asset={item} className={className} onOpen={onOpenCompare} />
        {item?.views?.project?.description ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-zinc-300">
            {item.views.project.description}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <div className="h-full w-full bg-zinc-900">
        {item.type === 'video' ? (
          <video src={item.url} controls className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <img src={item.url} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
      </div>
      {item?.views?.project?.description ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-zinc-300">
          {item.views.project.description}
        </div>
      ) : null}
    </article>
  );
}

function ToyProjectPage() {
  const { assets, projectData } = useConfig();
  const [activeCompareAsset, setActiveCompareAsset] = useState(null);
  const pageData = projectData?.toy_project;
  const modules = pageData?.modules || {};

  const target = modules.target || {};
  const action = modules.action || {};
  const review = modules.review || {};
  const assetsModule = modules.assets || {};

  const projectAssets = getProjectAssets(assets, 'toy_project', assetsModule.assetUrls || []);
  const [hero, ...restMedia] = projectAssets;

  const challengeTags = (target.tags || []).length > 0 ? target.tags : ['#视觉溢价感低', '#用户理解门槛高', '#素材复用率不足'];
  const actionList = (action.bullets || []).length > 0 ? action.bullets : ['素材矩阵规划', '布光策略制定', '镜头语言统一', '后期调色规范'];
  const reviewCards = (review.cards || []).length > 0 ? review.cards : [
    { title: '产出规模', value: '0到1主导 · 100+ 素材' },
    { title: '痛点解决', value: '引入 GIF / 动图，显著降低理解门槛' },
    { title: '资产沉淀', value: '多渠道复用，跨部门协作效率提升' },
  ];

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-20 text-zinc-100 md:pt-24">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <Link
          to="/"
          className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs tracking-[0.14em] text-zinc-300 transition hover:border-zinc-500"
        >
          &lt;- 返回首页
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="relative aspect-[16/6] w-full">
            <img src={pageData?.coverUrl} alt={pageData?.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-10">
              <p className="text-xs tracking-[0.2em] text-zinc-400">PROJECT CASE STUDY</p>
              <h1 className="mt-3 font-serif text-3xl tracking-[0.08em] text-zinc-100 md:text-5xl">{pageData?.title}</h1>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <section className="relative overflow-hidden rounded-3xl bg-[#090b12] p-6 md:p-8">
            <div className="pointer-events-none absolute -left-20 bottom-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(116,84,255,0.18)_0%,rgba(116,84,255,0.03)_48%,rgba(0,0,0,0)_72%)] blur-2xl" />
            <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <p className="text-xs tracking-[0.2em] text-zinc-500">模块 01 · TARGET 目标与挑战</p>
                <div className="relative mt-3">
                  <p className="font-sans text-5xl font-semibold tracking-[0.2em] text-white/15 md:text-7xl">{target.headline || 'CHALLENGE'}</p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">{target.summary || '围绕拼装玩具从兴趣内容走向可转化内容，建立可复用视觉资产体系。'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {challengeTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs tracking-[0.08em] text-zinc-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-950/35 p-6 md:p-8">
            <p className="text-xs tracking-[0.18em] text-zinc-500">模块 02 · ACTION 动作与策略</p>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <h3 className="text-sm tracking-[0.16em] text-zinc-100">{action.title || '视觉策略'}</h3>
                <ul className="mt-4 space-y-2">
                  {actionList.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
                <div className="aspect-video w-full">
                  <img src={action.supportImageUrl} alt="Strategy board" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-950/35 p-6 md:p-8">
            <p className="text-xs tracking-[0.18em] text-zinc-500">模块 03 · ASSETS 核心素材展示</p>
            <div className="mt-2 text-xs text-zinc-500">{assetsModule.intro}</div>

            <div className="mt-4 grid gap-3 md:grid-cols-4 md:grid-rows-2">
              {hero ? (
                <MediaCell
                  item={hero}
                  className="md:col-span-2 md:row-span-2 min-h-[240px]"
                  onOpenCompare={setActiveCompareAsset}
                />
              ) : null}
              {restMedia.slice(0, 3).map((item) => (
                <MediaCell key={item.id} item={item} className="aspect-square min-h-[140px]" onOpenCompare={setActiveCompareAsset} />
              ))}
            </div>

            {restMedia.length > 3 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {restMedia.slice(3).map((item) => (
                  <MediaCell
                    key={`${item.id}-extra`}
                    item={item}
                    className="aspect-square"
                    onOpenCompare={setActiveCompareAsset}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-950/35 p-6 md:p-8">
            <p className="text-xs tracking-[0.18em] text-zinc-500">模块 04 · REVIEW 复盘结论</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {reviewCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <p className="text-[11px] tracking-[0.16em] text-zinc-400">{card.title.toUpperCase()}</p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-200">{card.value}</p>
                </article>
              ))}
            </div>
          </section>

          <ProjectCTA />
        </div>
      </section>

      <GlobalCompareModal
        isOpen={Boolean(activeCompareAsset)}
        asset={activeCompareAsset}
        onClose={() => setActiveCompareAsset(null)}
      />
    </main>
  );
}

export default ToyProjectPage;
