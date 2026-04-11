import { useRef } from 'react';

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

/**
 * 通用 OSS 上传字段组件（React + Vite）
 */
function OssUploadField({
  label,
  value,
  placeholder,
  accept,
  buttonText,
  uploadState,
  onChange,
  onUpload,
}) {
  const inputRef = useRef(null);
  const progress = Math.max(0, Math.min(100, Number(uploadState?.progress || 0)));
  const status = uploadState?.status || 'idle';

  return (
    <label className="block md:col-span-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs tracking-[0.12em] text-zinc-400">{label}</p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-[11px] tracking-[0.12em] text-zinc-200 transition hover:border-zinc-400"
        >
          {buttonText}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await onUpload(file);
            }
            event.target.value = '';
          }}
        />
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
        placeholder={placeholder}
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
    </label>
  );
}

export default OssUploadField;
