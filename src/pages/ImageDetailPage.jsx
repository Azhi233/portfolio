import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import { ImageHeroSection, ImageGalleryGrid, ImagePreviewModal } from '../components/image-detail/index.js';

function ImageDetailPage() {
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
        const [projectData, allImages] = await Promise.all([
          fetchJson(`/projects/${id}`),
          fetchJson('/projects?kind=photos'),
        ]);
        if (!mounted) return;
        setProject(projectData);
        const currentKey = String(projectData?.outlineTags?.[0] || projectData?.tags?.[0] || projectData?.category || '').trim().toLowerCase();
        const related = (Array.isArray(allImages) ? allImages : []).filter((item) => {
          const itemKey = String(item?.outlineTags?.[0] || item?.tags?.[0] || item?.category || '').trim().toLowerCase();
          return currentKey && itemKey === currentKey;
        });
        setGroupProjects(related.length > 0 ? related : [projectData]);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || t('imageDetail.loadError', 'Failed to load image project.'));
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

  const images = useMemo(() => {
    const sourceProjects = Array.isArray(groupProjects) && groupProjects.length > 0 ? groupProjects : project ? [project] : [];

    return sourceProjects.flatMap((item) => {
      const mediaItems = Array.isArray(item?.btsMedia) ? item.btsMedia : [];
      const mappedMedia = mediaItems
        .map((media, index) => {
          if (!media) return null;
          const url = String(media.url || media.coverUrl || media.thumbnailUrl || '').trim();
          if (!url) return null;
          return {
            id: media.id || `${item.id || 'image'}-${index}`,
            url,
            title: media.title || media.label || item.title,
            description: media.description || item.description || '',
            isGroupCover: Boolean(media.isGroupCover),
          };
        })
        .filter(Boolean);

      const coverUrl = String(item?.coverUrl || item?.thumbnailUrl || '').trim();
      const coverAsset = coverUrl
        ? {
            id: `${item.id || 'image'}-cover`,
            url: coverUrl,
            title: item.title,
            description: item.description || '',
            isGroupCover: true,
          }
        : null;

      return [coverAsset, ...mappedMedia].filter(Boolean);
    });
  }, [groupProjects, project]);

  const heroImage = project?.coverUrl || project?.thumbnailUrl || images.find((item) => item.isGroupCover)?.url || images[0]?.url || '';
  const hasPrivateAccess = Boolean(project?.accessPassword || project?.password || project?.deliveryPin);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
        <section className="mx-auto w-full max-w-6xl">
          <Card className="p-8 md:p-10">
            <p className="text-sm text-zinc-400">{t('imageDetail.loading', 'Loading image project...')}</p>
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
            <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('imageDetail.eyebrow', 'IMAGE DETAIL')}</p>
            <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('imageDetail.notFound', 'Image Not Found')}</h1>
            <p className="mt-5 text-sm leading-7 text-zinc-300">{error || t('imageDetail.missing', 'The selected image project could not be found.')}</p>
            <div className="mt-6">
              <Link to="/images">
                <Button type="button">{t('imageDetail.backImages', 'BACK TO IMAGES')}</Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/images" className="text-xs tracking-[0.18em] text-zinc-400 transition hover:text-white">
            ← {t('imageDetail.backImages', 'BACK TO IMAGES')}
          </Link>
          <div className="flex items-center gap-2">
            {hasPrivateAccess ? <Badge tone="warning">{t('imageDetail.protected', 'PROTECTED')}</Badge> : null}
            <Badge tone={project.isVisible === false ? 'danger' : 'success'}>{project.isVisible === false ? t('imageDetail.hidden', 'HIDDEN') : t('imageDetail.live', 'LIVE')}</Badge>
          </div>
        </div>

        <ImageHeroSection
          imageUrl={heroImage}
          title={project.title}
          description={project.description || t('imageDetail.noDescription', 'No description yet.')}
          category={project.category || t('imageDetail.uncategorized', 'Uncategorized')}
          featuredLabel={project.isFeatured ? t('imageDetail.featured', 'FEATURED') : ''}
        />

        <ImageGalleryGrid
          items={images}
          onSelect={setActiveAsset}
          label={t('imageDetail.asset', 'Asset')}
        />

        <ImagePreviewModal
          activeAsset={activeAsset}
          onClose={() => setActiveAsset(null)}
          title={t('imageDetail.assetPreview', 'Image Preview')}
          descriptionFallback={t('imageDetail.noAdditionalDescription', 'No additional description.')}
        />
      </section>
    </main>
  );
}

export default ImageDetailPage;
