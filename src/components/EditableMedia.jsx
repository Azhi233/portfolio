import { useEffect, useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import EditDialog from './EditDialog.jsx';

const REFRESH_BUFFER_MS = 60 * 1000;

export default function EditableMedia({ src, type = 'image', onChange, className = '' }) {
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

  useEffect(() => {
    if (!resolvedSrc) return undefined;
    const expiresAt = Number(resolvedSrc?.expiresAt || 0);
    if (!expiresAt) return undefined;

    const refreshAt = Math.max(0, expiresAt - Date.now() - REFRESH_BUFFER_MS);
    const timer = window.setTimeout(async () => {
      try {
        const nextUrl = await resolvedSrc.refreshUrl?.();
        if (nextUrl) {
          setResolvedSrc((prev) => ({ ...(prev || {}), url: nextUrl }));
          if (typeof onChange === 'function') onChange(nextUrl);
        }
      } catch {
        // ignore refresh failures and let the next render/interaction retry
      }
    }, refreshAt);

    return () => window.clearTimeout(timer);
  }, [resolvedSrc, onChange]);

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

  const handleSave = () => {
    const next = String(draft || '').trim();
    if (!next) {
      setError('请输入有效的 URL。');
      return;
    }
    onChange?.(next);
    setOpen(false);
  };

  const mediaClass = `${className} ${isEditMode ? 'cursor-pointer border border-dashed border-cyan-400/60 bg-cyan-400/5' : ''}`;

  return (
    <>
      {resolvedSrc && typeof resolvedSrc === 'object' && resolvedSrc.isExpiringSoon ? (
        <span className="sr-only">链接即将刷新</span>
      ) : null}
      {type === 'video' ? (
        <video src={mediaSrc} controls={!isEditMode} onClick={handleOpen} className={mediaClass} />
      ) : (
        <img src={mediaSrc} alt="editable media" onClick={handleOpen} className={mediaClass} />
      )}

      <EditDialog open={open} label="EDIT MEDIA URL" title="更改媒体链接" onClose={() => setOpen(false)}>
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError('');
          }}
          placeholder="https://..."
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
        />
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs tracking-[0.18em] text-zinc-300"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.18em] text-cyan-200"
          >
            保存
          </button>
        </div>
      </EditDialog>
    </>
  );
}
