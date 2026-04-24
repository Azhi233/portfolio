export default function SortableSection({ title, count, children, onMoveUp, onMoveDown, onCopy, onReset, onDragOver, onDrop, onDragLeave, isDraggingOver = false }) {
  return (
    <div
      className={`rounded-[1.75rem] border border-[#1b171420] bg-[#f8f4ee] p-5 shadow-[0_12px_40px_rgba(30,20,10,0.08)] md:p-6 transition ${isDraggingOver ? 'ring-2 ring-[#1b1714]/20' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-[#8b7768]">SECTION</p>
          <h2 className="mt-2 text-2xl tracking-[0.06em] text-[#16110d]">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {onMoveUp ? <button type="button" onClick={onMoveUp} className="rounded-full border border-[#1b17141f] bg-white px-3 py-1 text-xs text-[#5e5248]">UP</button> : null}
          {onMoveDown ? <button type="button" onClick={onMoveDown} className="rounded-full border border-[#1b17141f] bg-white px-3 py-1 text-xs text-[#5e5248]">DOWN</button> : null}
          {onCopy ? <button type="button" onClick={onCopy} className="rounded-full border border-[#1b17141f] bg-white px-3 py-1 text-xs text-[#5e5248]">COPY</button> : null}
          {onReset ? <button type="button" onClick={onReset} className="rounded-full border border-[#1b17141f] bg-white px-3 py-1 text-xs text-[#5e5248]">RESET</button> : null}
        </div>
      </div>
      <div className="mb-4 text-xs tracking-[0.12em] text-[#8b7768]">{count} slots</div>
      {children}
    </div>
  );
}
