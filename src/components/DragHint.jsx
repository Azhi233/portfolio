export default function DragHint({ text = '拖动排序', active = false }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] tracking-[0.14em] ${active ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-700' : 'border-[#1b17141f] bg-white text-[#5e5248]'}`}>
      <span>⠿</span>
      {text}
    </span>
  );
}
