import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

export default function EditableText({
  value,
  onChange,
  as: Tag = 'p',
  className = '',
  label = 'EDIT TEXT',
  placeholder = '',
  multiline = false,
  maxLength,
}) {
  const { isEditMode } = useConfig();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(String(value ?? ''));
    setError('');
  }, [open, value]);

  const canEdit = isEditMode && typeof onChange === 'function';

  const handleOpen = (event) => {
    if (!canEdit) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  const handleSave = () => {
    const next = String(draft ?? '');
    if (typeof maxLength === 'number' && maxLength > 0 && next.length > maxLength) {
      setError(`最多 ${maxLength} 个字符。`);
      return;
    }
    onChange?.(next);
    setOpen(false);
  };

  const displayValue = useMemo(() => String(value ?? ''), [value]);

  if (!isEditMode) {
    return <Tag className={className}>{displayValue}</Tag>;
  }

  if (!canEdit) {
    return <Tag className={className}>{displayValue}</Tag>;
  }

  const editableClass = 'cursor-pointer border border-dashed border-cyan-400/60 bg-cyan-400/5 hover:bg-cyan-400/10';

  return (
    <>
      <Tag onClick={handleOpen} className={`${className} outline-none transition ${editableClass}`}>
        {displayValue}
      </Tag>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-cyan-300/30 bg-zinc-950 p-5 shadow-2xl"
            >
              <p className="text-xs tracking-[0.22em] text-zinc-500">{label}</p>
              <h3 className="mt-3 text-lg text-white">更改文案</h3>

              {multiline ? (
                <textarea
                  value={draft}
                  rows={6}
                  placeholder={placeholder}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (error) setError('');
                  }}
                  className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
              ) : (
                <input
                  value={draft}
                  placeholder={placeholder}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (error) setError('');
                  }}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
              )}

              {typeof maxLength === 'number' && maxLength > 0 ? (
                <p className="mt-2 text-[10px] tracking-[0.18em] text-zinc-500">
                  {String(draft ?? '').length}/{maxLength}
                </p>
              ) : null}
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
