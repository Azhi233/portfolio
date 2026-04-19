function FileCard({ file }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-950/75 p-4">
      <p className="text-sm tracking-[0.08em] text-zinc-100">{file.name}</p>
      {file.note ? <p className="mt-2 text-xs leading-relaxed text-zinc-400">{file.note}</p> : null}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.14em] text-zinc-500">{String(file.actionType || 'download').toUpperCase()}</span>
        <a href={file.url} target="_blank" rel="noreferrer" className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-1.5 text-xs tracking-[0.12em] text-emerald-200">
          {file.actionType === 'upload' ? 'OPEN UPLOAD' : 'DOWNLOAD'}
        </a>
      </div>
    </article>
  );
}

export default FileCard;
