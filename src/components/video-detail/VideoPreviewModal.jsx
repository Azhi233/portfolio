import Modal from '../Modal.jsx';
import MediaPreview from '../MediaPreview.jsx';

export default function VideoPreviewModal({ activeAsset, onClose = () => {}, t = (key, fallback) => fallback }) {
  return (
    <Modal open={Boolean(activeAsset)} title={activeAsset?.title || t('videoDetail.assetPreview', 'Asset Preview')} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-7 text-zinc-300">{activeAsset?.description || t('videoDetail.noAdditionalDescription', 'No additional description.')}</p>
        <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <MediaPreview src={activeAsset?.videoUrl || activeAsset?.mainVideoUrl || activeAsset?.url || ''} title={activeAsset?.title || 'Asset preview'} kind="video" autoPlay muted={false} />
        </div>
      </div>
    </Modal>
  );
}
