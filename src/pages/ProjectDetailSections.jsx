import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import Input from '../components/Input.jsx';
import Textarea from '../components/Textarea.jsx';
import MediaPreview from '../components/MediaPreview.jsx';

export function ProjectDetailHero({ project, t }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-h-[320px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(0,0,0,0.12))] p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('projectDetail.hero', 'PROJECT / HERO')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{project.title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">{project.description || t('projectDetail.noDescription', 'No description yet.')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge>{project.category || t('projectDetail.uncategorized', 'Uncategorized')}</Badge>
            {project.role ? <Badge tone="default">{project.role}</Badge> : null}
            {project.isFeatured ? <Badge tone="warning">{t('projectDetail.featured', 'FEATURED')}</Badge> : null}
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('projectDetail.meta', 'PROJECT / META')}</p>
          <div className="mt-5 grid gap-4 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] tracking-[0.2em] text-zinc-500">{t('projectDetail.visibility', 'VISIBILITY')}</p>
              <p className="mt-2">{project.visibility || (project.isVisible === false ? t('projectDetail.hidden', 'Hidden') : t('projectDetail.public', 'Public'))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] tracking-[0.2em] text-zinc-500">{t('projectDetail.client', 'CLIENT')}</p>
              <p className="mt-2">{project.clientAgency || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProjectDetailVideoPreview({ project, heroMedia, t }) {
  return (
    <Card className="p-6 md:p-8">
      <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('projectDetail.videoPreview', 'VIDEO / PREVIEW')}</p>
      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/40 p-3">
        <div className="aspect-video overflow-hidden rounded-[1.1rem] bg-black/60">
          <MediaPreview src={String(heroMedia)} title={project.title} kind="video" autoPlay muted={false} />
        </div>
      </div>
    </Card>
  );
}

export function ProjectDetailGallery({ galleryImages, galleryVideos, setActiveAsset, t }) {
  return (
    <Card className="p-6 md:p-8">
      <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('projectDetail.gallery', 'BTS / GALLERY')}</p>
      <div className="mt-4 grid gap-5">
        <div>
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-500">{t('projectDetail.photoGallery', 'PHOTOS')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {galleryImages.length > 0 ? galleryImages.map((item, index) => (
              <button key={item.id || `img-${index}`} type="button" onClick={() => setActiveAsset(item)} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-white/20 hover:bg-white/5">
                <div className="aspect-[4/3] bg-black/40"><MediaPreview src={item.url} title={item.title || item.label || `Image ${index + 1}`} kind={item.kind} /></div>
                <div className="p-3"><p className="text-sm text-zinc-200">{item.title || item.label || `${t('projectDetail.asset', 'Asset')} ${index + 1}`}</p></div>
              </button>
            )) : <p className="text-sm text-zinc-500">{t('projectDetail.noPhotos', 'No photo assets yet.')}</p>}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-500">{t('projectDetail.videoGallery', 'VIDEOS')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {galleryVideos.length > 0 ? galleryVideos.map((item, index) => (
              <button key={item.id || `vid-${index}`} type="button" onClick={() => setActiveAsset(item)} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-white/20 hover:bg-white/5">
                <div className="aspect-video bg-black/40"><MediaPreview src={item.url} title={item.title || item.label || `Video ${index + 1}`} kind={item.kind} /></div>
                <div className="p-3"><p className="text-sm text-zinc-200">{item.title || item.label || `${t('projectDetail.asset', 'Asset')} ${index + 1}`}</p></div>
              </button>
            )) : <p className="text-sm text-zinc-500">{t('projectDetail.noVideos', 'No video assets yet.')}</p>}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProjectDetailPrivateAccess({ hasPrivateAccess, accessCode, setAccessCode, privateAccessCode, setShowAccess, setUnlockMessage, unlockMessage, files, handleDownload, downloadMessage, showAccess, t }) {
  return (
    <Card className="p-6 md:p-8">
      <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('projectDetail.privateSection', 'PRIVATE ACCESS')}</p>
      <p className="mt-4 text-sm leading-7 text-zinc-300">{hasPrivateAccess ? t('projectDetail.protectedPrompt', 'This project is protected. Enter the access code to reveal private delivery content.') : t('projectDetail.publicPrompt', 'This project is public and can be viewed directly.')}</p>
      {hasPrivateAccess ? <div className="mt-4 grid gap-3"><Input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder={t('projectDetail.enterPassword', 'Enter access password')} /><Button type="button" variant="success" onClick={() => { const matched = String(accessCode).trim() === privateAccessCode; setShowAccess(matched); setUnlockMessage(matched ? t('projectDetail.accessGranted', 'Access granted. Private files are now visible.') : t('projectDetail.accessDenied', 'Incorrect access code.')); }}>{t('projectDetail.unlock', 'UNLOCK')}</Button>{unlockMessage ? <p className="text-xs tracking-[0.12em] text-zinc-400">{unlockMessage}</p> : null}</div> : null}
      {showAccess && files.length > 0 ? <div className="mt-6 space-y-3">{files.map((file) => <div key={file.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-zinc-200">{file.label || file.name || file.id}</p><p className="mt-2 break-all text-xs text-zinc-500">{file.url || t('projectDetail.noUrl', 'No url')}</p></div><Button type="button" variant="subtle" onClick={() => handleDownload(file)}>{t('projectDetail.download', 'OPEN FILE')}</Button></div></div>)}</div> : null}
      {downloadMessage ? <p className="mt-4 text-sm text-zinc-400">{downloadMessage}</p> : null}
    </Card>
  );
}

export function ProjectDetailAssetModal({ activeAsset, setActiveAsset, t }) {
  return (
    <Modal open={Boolean(activeAsset)} title={activeAsset?.title || t('projectDetail.assetPreview', 'Asset Preview')} onClose={() => setActiveAsset(null)}>
      <div className="space-y-4">
        <p className="text-sm leading-7 text-zinc-300">{activeAsset?.description || t('projectDetail.noAdditionalDescription', 'No additional description.')}</p>
        <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <MediaPreview src={activeAsset?.url || ''} title={activeAsset?.title || 'Asset preview'} kind={activeAsset?.kind} />
        </div>
        <Textarea value={activeAsset?.url || ''} readOnly />
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="subtle" onClick={() => window.open(activeAsset?.url || '', '_blank', 'noopener,noreferrer')}>
            {t('projectDetail.openAsset', 'OPEN ASSET')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
