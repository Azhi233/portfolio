import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchJson, getAccessToken } from '../utils/api.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import MediaPreview from '../components/MediaPreview.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import { canAccessPrivateProject, getProjectGallery, splitGalleryByKind } from './projectDetailUtils.js';

function GalleryGrid({ items, onOpen }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto w-full max-w-[1040px] px-6 pb-16 md:px-10">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={item.id || item.url || index}
            type="button"
            onClick={() => onOpen(item)}
            className="group relative aspect-[1.36/1] overflow-hidden bg-[#e5e2d8] text-left"
            aria-label={item.title || item.label || `Deliverable ${index + 1}`}
          >
            <MediaPreview src={item.url} title={item.title || item.label || `Deliverable ${index + 1}`} kind={item.kind || item.mediaType} />
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
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

function ClientDeliverablesPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAsset, setActiveAsset] = useState(null);

  const token = String(location.state?.clientAccessToken || getAccessToken() || '').trim();
  const { hasPrivateAccess, canViewPrivate } = canAccessPrivateProject(project, token, Boolean(token));
  const { gallery, files } = useMemo(() => getProjectGallery(project, canViewPrivate), [canViewPrivate, project]);
  const { galleryImages, galleryVideos } = useMemo(() => splitGalleryByKind(gallery), [gallery]);

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

  const galleryItems = [...galleryImages, ...galleryVideos];
  const deliveryNavItems = [
    { label: 'Home', to: '/' },
    { label: 'Gallery', hash: '#gallery' },
    { label: 'Download', hash: '#downloads' },
    { label: 'Access', to: '/client-access' },
  ];

  return (
    <main className="min-h-screen bg-[#f5f4ef] text-[#161616]">
      <MinimalTopNav items={deliveryNavItems} />
      <section className="pt-24">
        {loading ? <div className="mx-auto max-w-[1040px] px-6 md:px-10"><Card className="bg-white p-8 text-sm text-[#161616]/50">Loading deliverables...</Card></div> : null}
        {!loading && (error || !project) ? (
          <div className="mx-auto max-w-[1040px] px-6 md:px-10">
            <Card className="bg-white p-8">
              <p className="text-sm text-rose-600">{error || 'Deliverables not found.'}</p>
              <div className="mt-5"><Link to="/client-access"><Button type="button">BACK TO LOGIN</Button></Link></div>
            </Card>
          </div>
        ) : null}
        {!loading && project && canViewPrivate ? (
          <div>
            <div id="gallery">
              <GalleryGrid items={galleryItems} onOpen={setActiveAsset} />
            </div>
            <div id="downloads" className="mx-auto w-full max-w-[1040px] scroll-mt-24 px-6 pb-20 md:px-10">
              <DownloadList files={files} />
            </div>
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
