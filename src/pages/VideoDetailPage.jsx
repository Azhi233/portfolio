import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import { VideoHeroSection, VideoGalleryGrid, VideoPreviewModal } from '../components/video-detail/index.js';
import { getProjectGroupKey, groupProjectsByCategory } from './projectListingUtils.js';

function VideoDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [groupProjects, setGroupProjects] = useState([]);
  const [activeAsset, setActiveAsset] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setActiveAsset(null);
      try {
        const [projectData, allVideos] = await Promise.all([
          fetchJson(`/projects/${id}`),
          fetchJson('/projects?kind=videos').catch(() => fetchJson('/projects')),
        ]);
        if (!mounted) return;
        setProject(projectData);
        const currentKey = getProjectGroupKey(projectData);
        const related = (Array.isArray(allVideos) ? allVideos : []).filter((item) => getProjectGroupKey(item) === currentKey);
        setGroupProjects(related.length > 0 ? related : [projectData]);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || t('videoDetail.loadError', 'Failed to load video project.'));
        setProject(null);
        setGroupProjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, t]);

  const groups = useMemo(() => groupProjectsByCategory(groupProjects), [groupProjects]);
  const heroProject = useMemo(() => {
    if (!Array.isArray(groupProjects) || groupProjects.length === 0) return project;
    return groupProjects.find((item) => item?.isVideoCover || item?.groupCover || item?.isFeatured) || groupProjects[0];
  }, [groupProjects, project]);
  const hasPrivateAccess = Boolean(project?.accessPassword || project?.password || project?.deliveryPin);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
        <section className="mx-auto w-full max-w-6xl">
          <Card className="p-8 md:p-10">
            <p className="text-sm text-zinc-400">{t('videoDetail.loading', 'Loading video project...')}</p>
          </Card>
        </section>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
        <section className="mx-auto w-full max-w-6xl">
          <Card className="p-8 md:p-10">
            <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('videoDetail.eyebrow', 'VIDEO DETAIL')}</p>
            <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('videoDetail.notFound', 'Video Not Found')}</h1>
            <p className="mt-5 text-sm leading-7 text-zinc-300">{error || t('videoDetail.missing', 'The selected video project could not be found.')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/projects">
                <Button type="button">{t('videoDetail.backVideos', 'BACK TO VIDEOS')}</Button>
              </Link>
              <Link to="/images">
                <Button type="button" variant="subtle">{t('videoDetail.goImages', 'GO TO IMAGES')}</Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const galleryVideos = (Array.isArray(groupProjects) ? groupProjects : []).filter((item) => item?.id !== heroProject?.id);

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/projects" className="text-xs tracking-[0.18em] text-zinc-400 transition hover:text-white">
            ← {t('videoDetail.backVideos', 'BACK TO VIDEOS')}
          </Link>
          <div className="flex items-center gap-2">
            {hasPrivateAccess ? <Badge tone="warning">{t('videoDetail.protected', 'PROTECTED')}</Badge> : null}
            <Badge tone={project.isVisible === false ? 'danger' : 'success'}>{project.isVisible === false ? t('videoDetail.hidden', 'HIDDEN') : t('videoDetail.live', 'LIVE')}</Badge>
          </div>
        </div>

        <VideoHeroSection project={heroProject || project} t={t} />

        <Card className="p-6 md:p-8">
          <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('videoDetail.preview', 'VIDEO / PREVIEW')}</p>
          <p className="mt-4 text-sm leading-7 text-zinc-300">{t('videoDetail.hint', 'The player will adapt its frame automatically based on the detected video aspect ratio.')}</p>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 md:p-8">
            <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('videoDetail.grouping', 'VIDEO / GROUPS')}</p>
            <div className="mt-4 space-y-6">
              {groups.map((group) => (
                <VideoGalleryGrid
                  key={group.key}
                  title={group.name}
                  items={group.projects}
                  t={t}
                  onSelect={setActiveAsset}
                />
              ))}
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('videoDetail.otherActions', 'VIDEO / ACTIONS')}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/images">
                <Button type="button" variant="subtle">{t('videoDetail.goImages', 'GO TO IMAGES')}</Button>
              </Link>
              <Link to="/projects">
                <Button type="button">{t('videoDetail.backVideos2', 'BACK TO VIDEOS')}</Button>
              </Link>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {t('videoDetail.metaSummary', 'This page keeps the video player first, while the grouped cards and cover priority follow the same modular structure as the image page.')}
            </p>
          </Card>
        </div>

        <VideoPreviewModal activeAsset={activeAsset} onClose={() => setActiveAsset(null)} t={t} />
      </section>
    </main>
  );
}

export default VideoDetailPage;
