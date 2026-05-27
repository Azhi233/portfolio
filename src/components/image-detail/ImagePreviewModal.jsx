import Modal from '../Modal.jsx';
import Textarea from '../Textarea.jsx';
import { resolveResourceUrl } from '../../utils/api.js';

export default function ImagePreviewModal({ activeAsset, onClose = () => {}, title = 'Image Preview', descriptionFallback = 'No additional description.' }) {
  const resolvedUrl = resolveResourceUrl(activeAsset?.url);

  return (
    <Modal open={Boolean(activeAsset)} title={activeAsset?.title || title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-7 text-zinc-300">{activeAsset?.description || descriptionFallback}</p>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          {resolvedUrl ? <img src={resolvedUrl} alt={activeAsset?.title || title} className="h-full w-full object-cover" /> : null}
        </div>
        <Textarea value={resolvedUrl || ''} readOnly />
      </div>
    </Modal>
  );
}
