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
              <p className="mt-3 truncate text-[11px] text-[#161616]/36">{item.url}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function DownloadList({ files }) {
  if (!files.length) return null;
  return (
    <section className="rounded-[32px] border border-[#e7e0d6] bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.04)] md:p-6">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#161616]/38">Download</p>
      <h2 className="mt-2 font-serif text-2xl tracking-[0.08em] text-[#161616]">Files</h2>
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

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-[#161616]">
      <MinimalTopNav />
      <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-28 md:px-10">
        {loading ? <Card className="bg-white p-8 text-sm text-[#161616]/50">Loading deliverables...</Card> : null}
        {!loading && (error || !project) ? (
          <Card className="bg-white p-8">
            <p className="text-sm text-rose-600">{error || 'Deliverables not found.'}</p>
            <div className="mt-5"><Link to="/client-access"><Button type="button">BACK TO LOGIN</Button></Link></div>
          </Card>
        ) : null}
        {!loading && project && canViewPrivate ? (
          <div className="space-y-8">
            <header className="rounded-[36px] border border-[#e7e0d6] bg-white p-6 shadow-[0_18px_70px_rgba(0,0,0,0.04)] md:p-8">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#161616]/38">Client Deliverables</p>
              <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div>
                  <h1 className="font-serif text-4xl tracking-[0.08em] md:text-6xl">{project.title}</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#161616]/56">{project.description || 'Private delivery package prepared for review and download.'}</p>
                </div>
                <div className="rounded-3xl border border-[#eee8df] bg-[#faf8f3] p-4 text-sm text-[#161616]/60">
                  <p><span className="text-[#161616]/35">Client</span> {project.clientAgency || project.customerName || 'Private client'}</p>
                  <p className="mt-2"><span className="text-[#161616]/35">Status</span> {project.status || 'ready'}</p>
                  <p className="mt-2"><span className="text-[#161616]/35">Files</span> {gallery.length}</p>
                </div>
              </div>
            </header>

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
