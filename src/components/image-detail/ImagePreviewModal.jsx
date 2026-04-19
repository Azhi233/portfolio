import Modal from '../Modal.jsx';
import Textarea from '../Textarea.jsx';

export default function ImagePreviewModal({ activeAsset, onClose = () => {}, title = 'Image Preview', descriptionFallback = 'No additional description.' }) {
  return (
    <Modal open={Boolean(activeAsset)} title={activeAsset?.title || title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-7 text-zinc-300">{activeAsset?.description || descriptionFallback}</p>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          {activeAsset?.url ? <img src={activeAsset.url} alt={activeAsset?.title || title} className="h-full w-full object-cover" /> : null}
        </div>
        <Textarea value={activeAsset?.url || ''} readOnly />
      </div>
    </Modal>
  );
}
