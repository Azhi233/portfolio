import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import EditableText from '../../components/EditableText.jsx';
import EditableMedia from '../../components/EditableMedia.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';
import EncryptedEnvelope from '../../components/EncryptedEnvelope.jsx';
import GlobalCompareModal from '../../components/GlobalCompareModal.jsx';
import ImageCompareCard from '../../components/ImageCompareCard.jsx';
import { downloadImagesAsZip } from '../../utils/downloadService.js';
import { trackEvent } from '../../utils/analytics.js';

const PRIVATE_ACCESS_PREFIX = 'project.private.access.';
const ADMIN_SESSION_KEY = 'director_auth_session';

export function getEmbedUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  if (/\.mp4(\?.*)?$/i.test(value)) return value;

  const bilibiliMatch = value.match(/(?:bilibili\.com\/video\/|b23\.tv\/)(BV[0-9A-Za-z]+)/i);
  if (bilibiliMatch?.[1]) {
    return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&high_quality=1&danmaku=0&as_wide=1`;
  }

  const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
  }

  const youtubeMatch = value.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (youtubeMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;
  }

  return value;
}

function ProjectNotFound() {
  return (
    <main className="min-h-screen bg-black px-6 pb-16 pt-24 text-zinc-100 md:px-12">
      <section className="mx-auto w-full max-w-4xl">
        <Link to="/" className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs tracking-[0.14em] text-zinc-300">
          &lt;- Back to Gallery
        </Link>
        <div className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center md:p-12">
          <p className="text-xs tracking-[0.26em] text-zinc-500">404</p>
          <h1 className="mt-3 font-serif text-3xl tracking-[0.08em] text-zinc-100 md:text-5xl">Project Not Found</h1>
        </div>
      </section>
    </main>
  );
}

function normalizeGalleryAssets(project) {
  const bts = Array.isArray(project?.btsMedia) ? project.btsMedia : [];
  return bts.map((url, index) => ({
    id: `${project.id}-gallery-${index}`,
    type: 'image',
    title: `Image ${index + 1}`,
    url,
    variants: { graded: url },
  }));
}

function ProjectDetail() {
  const { id } = useParams();
  const {
    projects,
    isUnlocked,
    unlockProjectAccess,
    isDeliveryUnlocked,
    unlockDeliveryAccess,
  } = useConfig();

  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const [videoStartAt, setVideoStartAt] = useState(null);
  const [activeCompareAsset, setActiveCompareAsset] = useState(null);

  const [deliveryPinInput, setDeliveryPinInput] = useState('');
  const [deliveryPinError, setDeliveryPinError] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadState, setDownloadState] = useState({ loading: false, text: '' });

  const project = useMemo(() => projects.find((item) => item.id === id), [id, projects]);

  useEffect(() => {
    if (typeof window === 'undefined' || !project?.id) return;
    const key = `${PRIVATE_ACCESS_PREFIX}${project.id}`;
    const legacySessionUnlocked = window.sessionStorage.getItem(key) === 'true';
    const contextUnlocked = isUnlocked(project.id);

    if (legacySessionUnlocked && !contextUnlocked) unlockProjectAccess(project.id);

    setIsPrivateUnlocked(legacySessionUnlocked || contextUnlocked);
    setIsAdminSession(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  }, [project?.id, isUnlocked, unlockProjectAccess]);

  if (!project || project.isVisible === false) return <ProjectNotFound />;

  const visibility = project.visibility || project.publishStatus || 'Published';
  const isPrivate = visibility === 'Private';
  const canViewPrivate = !isPrivate || isPrivateUnlocked || isUnlocked(project.id);
  const deliveryUnlocked = isDeliveryUnlocked(project.id);
  const deliveryPinRequired = Boolean(String(project.deliveryPin || '').trim());

  const privateFiles = Array.isArray(project.privateFiles)
    ? [...project.privateFiles].filter((item) => item?.enabled !== false).sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0))
    : [];

  const galleryAssets = normalizeGalleryAssets(project).filter((item) => /^https?:\/\//i.test(item.url));

  const mainVideoUrl = project.mainVideoUrl || project.videoUrl;
  const embedUrl = getEmbedUrl(mainVideoUrl);
  const isMp4 = /\.mp4(\?.*)?$/i.test(embedUrl);
  const isEmbedIframe =
    /^https?:\/\/player\.bilibili\.com\//i.test(embedUrl) ||
    /^https?:\/\/player\.vimeo\.com\//i.test(embedUrl) ||
    /^https?:\/\/www\.youtube-nocookie\.com\//i.test(embedUrl);

  const toggleSelect = (asset) => {
    setSelectedIds((prev) => (prev.includes(asset.id) ? prev.filter((idItem) => idItem !== asset.id) : [...prev, asset.id]));
  };

  const runZipDownload = async (items) => {
    if (!deliveryUnlocked) {
      setDeliveryPinError('请先完成提货码验证后再下载。');
      return;
    }
    try {
      setDownloadState({ loading: true, text: '准备开始下载...' });
      await downloadImagesAsZip({
        items,
        projectName: project.title,
        onProgress: (progress) => {
          setDownloadState({ loading: true, text: progress.label || '下载中...' });
        },
      });
      setDownloadState({ loading: false, text: '下载已开始。' });
      setTimeout(() => setDownloadState({ loading: false, text: '' }), 2200);
    } catch (error) {
      setDownloadState({ loading: false, text: '' });
      setDeliveryPinError(error?.message || '下载失败，请稍后重试。');
    }
  };

  const selectedAssets = galleryAssets.filter((item) => selectedIds.includes(item.id));

  return (
    <main className="min-h-screen bg-black px-6 pb-16 pt-20 text-zinc-100 md:px-12 md:pt-24">
      <section className="mx-auto w-full max-w-6xl">
        <Link to="/" className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs tracking-[0.14em] text-zinc-300">
          &lt;- Back to Gallery
        </Link>

        {isPrivate && !canViewPrivate ? (
          <EncryptedEnvelope
            projectTitle={project.title}
            onUnlock={(input) => {
              const matched = String(input || '') === String(project.accessPassword || '');
              if (!matched) return false;
              if (typeof window !== 'undefined') {
                const key = `${PRIVATE_ACCESS_PREFIX}${project.id}`;
                window.sessionStorage.setItem(key, 'true');
              }
              unlockProjectAccess(project.id);
              setIsPrivateUnlocked(true);
              return true;
            }}
          />
        ) : (
          <>
            {isAdminSession ? (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
                    window.location.assign('/console');
                  }}
                  className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.14em] text-emerald-200"
                >
                  OPEN DIRECTOR CONSOLE
                </button>
              </div>
            ) : null}

            <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 md:p-4">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                {isMp4 ? (
                  <EditableMedia type="video" src={embedUrl} className="h-full w-full object-cover" onChange={() => {}} />
                ) : isEmbedIframe ? (
                  <iframe src={embedUrl} title={project.title} allow="autoplay; fullscreen" allowFullScreen className="h-full w-full border-0" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm tracking-[0.08em] text-zinc-400">
                    Unsupported video URL.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-8 border-t border-zinc-800 pt-8 md:grid-cols-[1.2fr_0.8fr] md:items-start">
              <div>
                <EditableText as="h1" className="font-serif text-4xl tracking-[0.08em] text-zinc-100 md:text-6xl" value={project.title} />
                <div className="mt-6 h-px w-40 bg-zinc-700" />
                <EditableText as="p" className="mt-6 max-w-3xl text-sm leading-relaxed tracking-[0.06em] text-zinc-300 md:text-base" value={project.description || 'Cinematic project detail.'} />
              </div>
              <div className="space-y-4 text-right md:text-left">
                <EditableText as="p" className="text-xs tracking-[0.22em] text-zinc-500" value="CATEGORY" />
                <EditableText as="p" className="text-sm tracking-[0.14em] text-zinc-200" value={project.category} />
              </div>
            </div>

            {deliveryPinRequired ? (
                    src={embedUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onPlay={() => {
                      setVideoStartAt(Date.now());
                      trackEvent('video_play_clicked', { projectId: project.id, title: project.title, videoUrl: mainVideoUrl });
                    }}
                    onPause={() => {
                      if (!videoStartAt) return;
                      const seconds = Math.max(1, Math.round((Date.now() - videoStartAt) / 1000));
                      trackEvent('video_watch_duration', { projectId: project.id, title: project.title, seconds });
                      setVideoStartAt(null);
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : isEmbedIframe ? (
                  <iframe src={embedUrl} title={project.title} allow="autoplay; fullscreen" allowFullScreen className="h-full w-full border-0" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm tracking-[0.08em] text-zinc-400">
                    Unsupported video URL.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-8 border-t border-zinc-800 pt-8 md:grid-cols-[1.2fr_0.8fr] md:items-start">
              <div>
                <EditableText as="h1" className="font-serif text-4xl tracking-[0.08em] text-zinc-100 md:text-6xl" value={project.title} />
                <div className="mt-6 h-px w-40 bg-zinc-700" />
                <EditableText as="p" className="mt-6 max-w-3xl text-sm leading-relaxed tracking-[0.06em] text-zinc-300 md:text-base" value={project.description || 'Cinematic project detail.'} />
              </div>
              <div className="space-y-4 text-right md:text-left">
                <EditableText as="p" className="text-xs tracking-[0.22em] text-zinc-500" value="CATEGORY" />
                <EditableText as="p" className="text-sm tracking-[0.14em] text-zinc-200" value={project.category} />
              </div>
            </div>

            {deliveryPinRequired ? (
              <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/75 p-4">
                <p className="text-xs tracking-[0.2em] text-zinc-500">DELIVERY PIN VERIFICATION</p>
                {deliveryUnlocked ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs tracking-[0.12em] text-emerald-300">
                    <Check className="h-3.5 w-3.5" /> DELIVERY ACCESS VERIFIED
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      value={deliveryPinInput}
                      onChange={(event) => {
                        setDeliveryPinInput(event.target.value);
                        if (deliveryPinError) setDeliveryPinError('');
                      }}
                      placeholder="请输入提货码"
                      className="w-full max-w-xs rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400 transition focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const ok = String(deliveryPinInput || '') === String(project.deliveryPin || '');
                        if (!ok) {
                          setDeliveryPinError('提货码错误。');
                          return;
                        }
                        unlockDeliveryAccess(project.id);
                        setDeliveryPinError('');
                      }}
                      className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-2 text-xs tracking-[0.12em] text-emerald-200"
                    >
                      验证提货码
                    </button>
                  </div>
                )}
                {deliveryPinError ? <p className="mt-2 text-xs text-rose-400">{deliveryPinError}</p> : null}
              </section>
            ) : null}

            {galleryAssets.length > 0 ? (
              <section className="mt-8 border-t border-zinc-800 pt-8">
                <div className="sticky top-3 z-20 mb-4 rounded-xl border border-zinc-700 bg-zinc-950/90 p-3 backdrop-blur">
                  {!isSelectionMode ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs tracking-[0.16em] text-zinc-400">ALBUM ACTION BAR</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!deliveryUnlocked) {
                              setDeliveryPinError('请先完成提货码验证。');
                              return;
                            }
                            setIsSelectionMode(true);
                          }}
                          className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.12em] text-zinc-200"
                        >
                          选择下载
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            runZipDownload(
                              galleryAssets.map((item, index) => ({
                                url: item.url,
                                fileName: `${project.title}-all-${index + 1}`,
                              })),
                            );
                          }}
                          className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-1.5 text-xs tracking-[0.12em] text-emerald-200"
                        >
                          一键下载全部
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs tracking-[0.16em] text-zinc-300">已选择 {selectedIds.length} 张</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            runZipDownload(
                              selectedAssets.map((item, index) => ({
                                url: item.url,
                                fileName: `${project.title}-selected-${index + 1}`,
                              })),
                            );
                          }}
                          disabled={selectedIds.length === 0}
                          className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-3 py-1.5 text-xs tracking-[0.12em] text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          打包下载已选 (ZIP)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedIds([]);
                          }}
                          className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.12em] text-zinc-200"
                        >
                          取消选择
                        </button>
                      </div>
                    </div>
                  )}

                  {downloadState.loading || downloadState.text ? (
                    <p className="mt-2 text-xs tracking-[0.12em] text-zinc-400">{downloadState.text}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {galleryAssets.map((item) => (
                    <ImageCompareCard
                      key={item.id}
                      asset={item}
                      className="aspect-[4/5]"
                      onOpen={setActiveCompareAsset}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.includes(item.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {privateFiles.length > 0 ? (
              <section className="mt-10 border-t border-zinc-800 pt-8">
                <h2 className="text-xs tracking-[0.24em] text-zinc-500">PRIVATE DELIVERY FILES</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {privateFiles.map((file) => (
                    <article key={file.id} className="rounded-xl border border-zinc-800 bg-zinc-950/75 p-4">
                      <p className="text-sm tracking-[0.08em] text-zinc-100">{file.name}</p>
                      {file.note ? <p className="mt-2 text-xs leading-relaxed text-zinc-400">{file.note}</p> : null}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] tracking-[0.14em] text-zinc-500">{String(file.actionType || 'download').toUpperCase()}</span>
                        <a href={file.url} target="_blank" rel="noreferrer" className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-1.5 text-xs tracking-[0.12em] text-emerald-200">
                          {file.actionType === 'upload' ? 'OPEN UPLOAD' : 'DOWNLOAD'}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </section>

      <GlobalCompareModal
        isOpen={Boolean(activeCompareAsset)}
        asset={activeCompareAsset}
        onClose={() => setActiveCompareAsset(null)}
      />
    </main>
  );
}

export default ProjectDetail;
