import { useEffect, useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import EditDialog from './EditDialog.jsx';

const REFRESH_BUFFER_MS = 60 * 1000;
const RECENT_MEDIA_URLS_KEY = 'portfolio.edit.recentMediaUrls';
const MAX_RECENT_MEDIA_URLS = 20;

function readRecentMediaUrls() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_MEDIA_URLS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveRecentMediaUrl(url) {
  if (typeof window === 'undefined') return;
  const next = [String(url || '').trim(), ...readRecentMediaUrls()].filter(Boolean);
  const deduped = [...new Set(next)].slice(0, MAX_RECENT_MEDIA_URLS);
  window.localStorage.setItem(RECENT_MEDIA_URLS_KEY, JSON.stringify(deduped));
}

export default function EditableMedia({
  src,
  type = 'image',
  onChange,
  className = '',
  style,
  onLoad,
  onLoadedMetadata,
  onClick,
  onDoubleClick,
  alt = 'editable media',
  urlOptions = [],
}) {
  const { isEditMode } = useConfig();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(src || '');
  const [error, setError] = useState('');
  const [resolvedSrc, setResolvedSrc] = useState(src || '');

  useEffect(() => {
    if (open) setDraft(src || '');
  }, [src, open]);

  useEffect(() => {
    setResolvedSrc(src || '');
  }, [src]);

  const mediaSrc = useMemo(() => {
    if (!resolvedSrc) return '';
    if (typeof resolvedSrc === 'string') return resolvedSrc;
    return resolvedSrc.url || '';
  }, [resolvedSrc]);

  const handleOpen = (event) => {
    if (!isEditMode) return;
    event.preventDefault();
    event.stopPropagation();
    setError('');
    setOpen(true);
  };

  const handleConfirm = async () => {
    const next = String(draft || '').trim();
    if (!next) {
      setError('请输入有效的 URL。');
      return;
    }
    try {
      saveRecentMediaUrl(next);
      await Promise.resolve(onChange?.(next));
      setOpen(false);
    } catch (error) {
      setError(error?.message || '保存失败，请重试。');
    }
  };

  const mediaClass = `${className} ${isEditMode ? 'cursor-pointer border border-dashed border-cyan-400/60 bg-cyan-400/5' : ''}`;

  const options = Array.from(
    new Set([
      String(src || '').trim(),
      String(mediaSrc || '').trim(),
      ...urlOptions.map((item) => String(item || '').trim()),
      ...readRecentMediaUrls(),
    ].filter(Boolean)),
  );

  const mediaProps = {
    className: mediaClass,
    style,
    onClick: isEditMode ? handleOpen : onClick,
    onDoubleClick: isEditMode ? onDoubleClick : onDoubleClick,
  };

  return (
    <>
      {type === 'video' ? (
        <video src={mediaSrc} controls={!isEditMode} onLoadedMetadata={onLoadedMetadata} {...mediaProps} />
      ) : (
        <img src={mediaSrc} alt={alt} onLoad={onLoad} {...mediaProps} />
      )}

      <EditDialog open={open} label="EDIT MEDIA URL" title="更改媒体链接" onClose={() => setOpen(false)}>
        <label className="mt-4 block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">已上传 / 历史链接</p>
          <select
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError('');
            }}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">-- 直接输入或选择已有链接 --</option>
            {options.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="mt-3 block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">直接输入</p>
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError('');
            }}
            placeholder="https://..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
          />
        </label>

        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-4 py-2 text-xs tracking-[0.18em] text-zinc-300">
            取消
          </button>
          <button type="button" onClick={handleConfirm} className="rounded-lg border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.18em] text-cyan-200">
            保存
          </button>
        </div>
      </EditDialog>
    </>
  );
}
