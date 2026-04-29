import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchJson, getAccessToken } from '../utils/api.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import MediaPreview from '../components/MediaPreview.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import { canAccessPrivateProject, getProjectGallery, splitGalleryByKind } from './projectDetailUtils.js';

function DeliverableGrid({ title, items, onOpen }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#161616]/38">Deliverables</p>
          <h2 className="mt-1 font-serif text-2xl tracking-[0.08em] text-[#161616]">{title}</h2>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#161616]/35">{items.length} files</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <button
            key={item.id || item.url || index}
            type="button"
            onClick={() => onOpen(item)}
            className="group overflow-hidden rounded-[28px] border border-[#e7e0d6] bg-white text-left shadow-[0_18px_60px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-[#d6cec1]"
          >
            <div className="aspect-video bg-[#ece8df]">
              <MediaPreview src={item.url} title={item.title || item.label || `Deliverable ${index + 1}`} />
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#161616]/35">{String(item.kind || item.mediaType || 'file')}</p>
              <h3 className="mt-2 line-clamp-2 text-sm tracking-[0.04em] text-[#161616]">{item.title || item.label || item.name || `Deliverable ${index + 1}`}</h3>
              <p className="mt-3 truncate text-[11px] text-[#161616]/36">{item.description || item.category || item.url}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function DownloadList({ files }) {
  const downloadAll = () => {
    files.forEach((file, index) => {
      const url = String(file.url || '').trim();
      if (!url) return;
      window.setTimeout(() => window.open(url, '_blank', 'noreferrer'), index * 120);
    });
  };

  const copyAllLinks = async () => {
    const links = files.map((file) => String(file.url || '').trim()).filter(Boolean).join('\n');
    if (!links) return;
    await navigator.clipboard.writeText(links);
  };

  if (!files.length) return null;
  return (
    <section className="rounded-[32px] border border-[#e7e0d6] bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.04)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#161616]/38">Download</p>
          <h2 className="mt-2 font-serif text-2xl tracking-[0.08em] text-[#161616]">Files</h2>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#161616]/35">{files.length} items</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="subtle" onClick={copyAllLinks}>COPY LINKS</Button>
          <Button type="button" variant="primary" onClick={downloadAll}>DOWNLOAD ALL</Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {files.map((file, index) => (
          <a
            key={file.id || file.url || index}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-4 rounded-2xl border border-[#eee8df] bg-[#faf8f3] px-4 py-3 text-sm text-[#161616] transition hover:border-[#d8d0c5] hover:bg-white"
          >
            <span className="min-w-0 truncate">{file.title || file.label || file.name || `File ${index + 1}`}</span>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[#161616]/35">Open</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function MetaChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#eee8df] bg-[#faf8f3] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#161616]/35">{label}</p>
      <p className="mt-2 text-sm text-[#161616]">{value}</p>
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-white backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">{label}</p>
      <p className="mt-2 text-2xl tracking-[0.08em]">{value}</p>
    </div>
  );
}

function ClientDeliverablesPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAsset, setActiveAsset] = useState(null);
  const [showMeta, setShowMeta] = useState(true);

  const token = String(location.state?.clientAccessToken || getAccessToken() || '').trim();
  const { hasPrivateAccess, canViewPrivate } = canAccessPrivateProject(project, token, Boolean(token));
  const { gallery, files } = useMemo(() => getProjectGallery(project, canViewPrivate), [canViewPrivate, project]);
  const { galleryImages, galleryVideos } = useMemo(() => splitGalleryByKind(gallery), [gallery]);
  const heroImage = galleryImages[0]?.url || galleryVideos[0]?.url || project?.coverUrl || project?.thumbnailUrl || '';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    fetchJson(`/projects/${id}`)
      .then((data) => {
        if (!mounted) return;
        setProject(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load deliverables.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && project && hasPrivateAccess && !canViewPrivate) navigate('/client-access', { replace: true });
  }, [canViewPrivate, hasPrivateAccess, loading, navigate, project]);

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-[#161616]">
      <MinimalTopNav />
      <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-24 md:px-10">
        {loading ? <Card className="bg-white p-8 text-sm text-[#161616]/50">Loading deliverables...</Card> : null}
        {!loading && (error || !project) ? (
          <Card className="bg-white p-8">
            <p className="text-sm text-rose-600">{error || 'Deliverables not found.'}</p>
            <div className="mt-5"><Link to="/client-access"><Button type="button">BACK TO LOGIN</Button></Link></div>
          </Card>
        ) : null}
        {!loading && project && canViewPrivate ? (
          <div className="space-y-8">
            <header className="overflow-hidden rounded-[40px] border border-[#e7e0d6] bg-white shadow-[0_18px_70px_rgba(0,0,0,0.04)]">
              <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[360px] bg-[#0f0f11]">
                  {heroImage ? (
                    <div className="absolute inset-0">
                      <MediaPreview src={heroImage} title={project.title || 'Hero preview'} />
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
                  <div className="relative flex h-full flex-col justify-between p-6 text-white md:p-8">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/80">Private Delivery</span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/80">Brand Deck</span>
                    </div>
                    <div className="max-w-3xl">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-white/60">Client Deliverables</p>
                      <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] md:text-6xl">{project.title}</h1>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">{project.description || 'Private delivery package prepared for review and download.'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 p-6 md:p-8">
                  <div className="grid gap-3 md:grid-cols-2">
                    <HeroStat label="Files" value={gallery.length} />
                    <HeroStat label="Status" value={String(project.status || 'ready').toUpperCase()} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <MetaChip label="Client" value={project.clientAgency || project.customerName || 'Private client'} />
                    <MetaChip label="Category" value={project.category || 'Private delivery'} />
                    <MetaChip label="Release" value={project.releaseDate || 'TBD'} />
                    <MetaChip label="Customer code" value={project.clientCode || 'N/A'} />
                  </div>
                  <div className="rounded-[26px] border border-[#e7e0d6] bg-[#faf8f3] p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#161616]/35">Access</p>
                    <p className="mt-2 text-sm leading-6 text-[#161616]/72">{project.visibility || 'private'} · protected by password access</p>
                  </div>
                  <Button type="button" variant="subtle" onClick={() => setShowMeta((prev) => !prev)}>{showMeta ? 'Hide details' : 'Show details'}</Button>
                </div>
              </div>
              {showMeta ? (
                <div className="border-t border-[#e7e0d6] bg-[#fbfaf7] p-6 md:p-8">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetaChip label="Category" value={project.category || 'Private delivery'} />
                    <MetaChip label="Release" value={project.releaseDate || 'TBD'} />
                    <MetaChip label="Customer code" value={project.clientCode || 'N/A'} />
                    <MetaChip label="Access" value={project.visibility || 'private'} />
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#eee8df] bg-white px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#161616]/35">Files</p>
                      <p className="mt-2 text-sm text-[#161616]">{files.length} ready</p>
                    </div>
                    <div className="rounded-2xl border border-[#eee8df] bg-white px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#161616]/35">Package</p>
                      <p className="mt-2 text-sm text-[#161616]">Gallery + downloads</p>
                    </div>
                    <div className="rounded-2xl border border-[#eee8df] bg-white px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#161616]/35">Notes</p>
                      <p className="mt-2 text-sm text-[#161616]">Prepared for private review</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </header>

            <div className="grid gap-4 rounded-[32px] border border-[#e7e0d6] bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.04)] md:grid-cols-3 md:p-6">
              <div className="rounded-[24px] border border-[#eee8df] bg-[#faf8f3] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#161616]/35">Highlights</p>
                <p className="mt-2 text-sm leading-6 text-[#161616]/70">精选素材、交付文件和下载链接都聚合在同一页，方便客户快速浏览和下载。</p>
              </div>
              <div className="rounded-[24px] border border-[#eee8df] bg-[#faf8f3] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#161616]/35">Viewing</p>
                <p className="mt-2 text-sm leading-6 text-[#161616]/70">点击任意图像或视频可全屏预览，适合展示最终交付成果。</p>
              </div>
              <div className="rounded-[24px] border border-[#eee8df] bg-[#faf8f3] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#161616]/35">Delivery</p>
                <p className="mt-2 text-sm leading-6 text-[#161616]/70">下载区可直接打开全部文件或复制全部链接，适合客户快速留存资料。</p>
              </div>
            </div>

            <DeliverableGrid title="Video Assets" items={galleryVideos} onOpen={setActiveAsset} />
            <DeliverableGrid title="Image Assets" items={galleryImages} onOpen={setActiveAsset} />
            <DownloadList files={files} />
          </div>
        ) : null}
      </section>

      {activeAsset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveAsset(null)}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] bg-[#050507]" onClick={(event) => event.stopPropagation()}>
            <div className="aspect-video bg-black"><MediaPreview src={activeAsset.url} title={activeAsset.title || activeAsset.label || 'Deliverable'} /></div>
            <div className="flex items-center justify-between gap-4 p-4 text-white">
              <p className="min-w-0 truncate text-sm">{activeAsset.title || activeAsset.label || activeAsset.name || 'Deliverable'}</p>
              <a href={activeAsset.url} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.18em] text-white/60 hover:text-white">Open</a>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default ClientDeliverablesPage;
