import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import { canAccessPrivateProject, getProjectGallery, splitGalleryByKind } from './projectDetailUtils.js';
import { ProjectDetailAssetModal, ProjectDetailGallery, ProjectDetailHero, ProjectDetailPrivateAccess, ProjectDetailVideoPreview } from './ProjectDetailSections.jsx';

function ProjectDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [showAccess, setShowAccess] = useState(false);
  const [activeAsset, setActiveAsset] = useState(null);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [unlockMessage, setUnlockMessage] = useState('');

  const token = String(location.state?.clientAccessToken || '').trim();
  const { privateAccessCode, hasPrivateAccess, canViewPrivate } = canAccessPrivateProject(project, token, showAccess);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setAccessCode('');
      setShowAccess(false);
      setActiveAsset(null);
      setDownloadMessage('');
      setUnlockMessage('');
      try {
        const projectData = await fetchJson(`/projects/${id}`);
        if (!mounted) return;
        setProject(projectData);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || t('projectDetail.loadError', 'Failed to load project.'));
        setProject(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, t]);

  useEffect(() => {
    if (!project || !hasPrivateAccess) return;
    if (token && token.length > 0) {
      setAccessCode(privateAccessCode);
      setShowAccess(true);
      setUnlockMessage(t('projectDetail.accessGranted', 'Access granted. Private files are now visible.'));
    }
  }, [hasPrivateAccess, privateAccessCode, project, t, token]);

  const { gallery, files } = useMemo(() => getProjectGallery(project, canViewPrivate), [canViewPrivate, project]);
  const { galleryImages, galleryVideos } = useMemo(() => splitGalleryByKind(gallery), [gallery]);
  const heroMedia = project?.mainVideoUrl || project?.videoUrl || project?.coverUrl || project?.thumbnailUrl || '';

  if (loading) {
    return <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10"><section className="mx-auto w-full max-w-6xl"><Card className="p-8 md:p-10"><p className="text-sm text-zinc-400">{t('projectDetail.loading', 'Loading project...')}</p></Card></section></main>;
  }

  if (error || !project) {
    return <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10"><section className="mx-auto w-full max-w-6xl"><Card className="p-8 md:p-10"><p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('projectDetail.eyebrow', 'PROJECT DETAIL')}</p><h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('projectDetail.notFound', 'Project Not Found')}</h1><p className="mt-5 text-sm leading-7 text-zinc-300">{error || t('projectDetail.missing', 'The selected project could not be found.')}</p><div className="mt-6"><Link to="/client-access"><Button type="button">{t('projectDetail.backProjects', 'BACK TO CLIENT ACCESS')}</Button></Link></div></Card></section></main>;
  }

  const handleDownload = (file) => {
    const fileName = file.label || file.name || file.id;
    const url = String(file?.url || '').trim();
    if (!url) {
      setDownloadMessage(t('projectDetail.noUrl', 'No url'));
      return;
    }

    setDownloadMessage(t('projectDetail.preparingDownload', { name: fileName }));
    window.setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
      setDownloadMessage(t('projectDetail.downloadStarted', { name: fileName }));
    }, 300);
  };

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/client-access" className="text-xs tracking-[0.18em] text-zinc-400 transition hover:text-white">
            ← {t('projectDetail.backProjects', 'BACK TO CLIENT ACCESS')}
          </Link>
          <Badge tone={project.isVisible === false ? 'danger' : 'success'}>{project.isVisible === false ? t('projectDetail.hidden', 'HIDDEN') : t('projectDetail.live', 'LIVE')}</Badge>
        </div>

        <ProjectDetailHero project={project} t={t} />

        {canViewPrivate ? (
          <>
            <ProjectDetailVideoPreview project={project} heroMedia={heroMedia} t={t} />
            <div className="grid gap-6 lg:grid-cols-2">
              <ProjectDetailGallery galleryImages={galleryImages} galleryVideos={galleryVideos} setActiveAsset={setActiveAsset} t={t} />
              <ProjectDetailPrivateAccess
                hasPrivateAccess={hasPrivateAccess}
                accessCode={accessCode}
                setAccessCode={setAccessCode}
                privateAccessCode={privateAccessCode}
                setShowAccess={setShowAccess}
                setUnlockMessage={setUnlockMessage}
                unlockMessage={unlockMessage}
                files={files}
                handleDownload={handleDownload}
                downloadMessage={downloadMessage}
                showAccess={showAccess}
                t={t}
              />
            </div>
          </>
        ) : null}

        <ProjectDetailAssetModal activeAsset={activeAsset} setActiveAsset={setActiveAsset} t={t} />
      </section>
    </main>
  );
}

export default ProjectDetailPage;
