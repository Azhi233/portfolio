import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadFileToOSS } from '../services/ossUpload.js';

function statusText(status) {
  if (status === 'uploading') return '上传中';
  if (status === 'success') return '上传成功';
  if (status === 'error') return '上传失败';
  return '待上传';
}

function statusClass(status) {
  if (status === 'success') return 'text-emerald-300';
  if (status === 'error') return 'text-rose-300';
  if (status === 'uploading') return 'text-sky-300';
  return 'text-zinc-500';
}

export default function CoverUploader({
  label = 'Cover Image',
  value = '',
  preview,
  dir = 'images/cover',
  buttonText = '上传封面图片',
  accept = 'image/*',
  onUploadSuccess,
  onChange,
}) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState('');
  const [uploadState, setUploadState] = useState({ status: 'idle', progress: 0 });

  const activePreview = useMemo(() => preview || localPreview || value || '', [preview, localPreview, value]);
  const progress = Math.max(0, Math.min(100, Number(uploadState.progress || 0)));
  const status = uploadState.status || 'idle';

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const openPicker = () => inputRef.current?.click();

  const handleUpload = async (file) => {
    if (!(file instanceof File)) return;

    setUploadState({ status: 'uploading', progress: 0 });

    try {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      onChange?.(objectUrl);

      const result = await uploadFileToOSS({
        file,
        dir,
        onProgress: (nextProgress) => {
          setUploadState((prev) => ({
            ...prev,
            status: 'uploading',
            progress: nextProgress,
          }));
        },
      });

      const nextUrl = result?.url || '';
      if (nextUrl) {
        setLocalPreview(nextUrl);
        onChange?.(nextUrl);
        onUploadSuccess?.(nextUrl, result);
      }

      setUploadState({ status: 'success', progress: 100 });
    } catch (error) {
      console.error('Cover upload failed:', error);
      setUploadState({ status: 'error', progress: 0 });
    }
  };

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 transition ${
        isDragOver ? 'border-emerald-400 bg-emerald-400/5' : ''
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setIsDragOver(false);
        const file = event.dataTransfer.files?.[0];
        await handleUpload(file);
      }}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-[0.12em] text-zinc-400">{label}</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex cursor-pointer items-center rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-[11px] tracking-[0.12em] text-zinc-200 transition hover:border-zinc-400"
          >
            {buttonText}
          </button>
          {status === 'error' ? (
            <button
              type="button"
              onClick={openPicker}
              className="inline-flex cursor-pointer items-center rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 text-[11px] tracking-[0.12em] text-rose-200 transition hover:border-rose-300"
            >
              重试
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await handleUpload(file);
            }
            event.target.value = '';
          }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
        <div>
          <input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            placeholder="https://..."
          />

          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded bg-zinc-800">
              <div
                className={`h-full transition-all duration-300 ${
                  status === 'error' ? 'bg-rose-400' : status === 'success' ? 'bg-emerald-400' : 'bg-sky-400'
                }`}
                style={{ width: `${status === 'idle' ? 0 : progress}%` }}
              />
            </div>
            <p className={`mt-1 text-[11px] tracking-[0.08em] ${statusClass(status)}`}>
              {statusText(status)}{status !== 'idle' ? ` · ${progress}%` : ''}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
          {activePreview ? (
            <img src={activePreview} alt={label} className="h-full min-h-[120px] w-full object-cover" />
          ) : (
            <div className="flex min-h-[120px] items-center justify-center px-3 text-center text-[11px] leading-5 tracking-[0.08em] text-zinc-500">
              支持拖拽上传、点击选择文件
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
