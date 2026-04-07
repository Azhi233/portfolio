function BreakdownTab({ sliderPos, setSliderPos }) {
  return (
    <div className="relative aspect-video w-full animate-fade-in overflow-hidden rounded-xl border border-gray-800 bg-[#111] md:aspect-[21/9]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop')",
          filter: 'contrast(1.2) saturate(1.3) hue-rotate(10deg) brightness(0.9)',
        }}
      >
        <div className="absolute right-4 top-4 rounded border border-gray-700 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white">
          COLOR GRADED
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop')",
          filter: 'contrast(0.7) saturate(0.3) brightness(1.1)',
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
        }}
      >
        <div className="absolute left-4 top-4 rounded border border-gray-700 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-300">
          ARRI RAW / LOG-C
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-20 w-px cursor-ew-resize bg-white"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black shadow-2xl">
          <div className="flex gap-1">
            <div className="h-0 w-0 border-y-[4px] border-y-transparent border-r-[5px] border-r-white"></div>
            <div className="h-0 w-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-white"></div>
          </div>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

export default BreakdownTab;
