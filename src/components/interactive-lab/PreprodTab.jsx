function PreprodTab() {
  return (
    <div className="grid animate-fade-in grid-cols-1 gap-8 rounded-2xl border border-gray-800 bg-[#0a0a0a] p-6 lg:grid-cols-2 lg:gap-12 md:p-10">
      <div className="space-y-6">
        <div className="mb-4 border-b border-gray-800 pb-2"><span className="text-sm font-bold uppercase tracking-wider text-gray-500">Phase 1: Blueprint</span></div>
        <div className="relative flex aspect-video flex-col items-center justify-center overflow-hidden border border-gray-800 bg-[#111] p-4">
          <div className="absolute h-px w-3/4 rotate-[15deg] transform bg-gray-600"></div>
          <div className="absolute h-px w-3/4 -rotate-[15deg] transform bg-gray-600"></div>
          <div className="absolute mt-4 h-24 w-16 rounded border border-gray-500"></div>
          <span className="absolute bottom-4 left-4 font-mono text-xs text-gray-500">SCENE 01 / STORYBOARD</span>
        </div>
        <div className="flex h-32 items-center justify-center gap-8 border border-gray-800 bg-[#111] p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-700 bg-yellow-900/20 font-mono text-[10px] text-yellow-500">18K HMI</div>
          <div className="flex h-8 w-16 items-center justify-center rounded border border-white/50 bg-white/10 font-mono text-[10px] text-white">CAMERA</div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-700 bg-blue-900/20 font-mono text-[10px] text-blue-500">FILL</div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="mb-4 border-b border-gray-800 pb-2"><span className="text-sm font-bold uppercase tracking-wider text-white">Phase 2: Final Frame</span></div>
        <div
          className="relative aspect-video rounded bg-cover bg-center shadow-2xl"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop')" }}
        >
          <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 font-mono text-[10px] text-gray-400">ARRI ALEXA MINI / 35mm</div>
        </div>
        <div className="border border-gray-800 bg-[#111] p-4 font-mono text-[11px] leading-relaxed text-gray-400">
          {'> EXECUTE: 18K HMI through 12x12 Grid Cloth (Key).'}
          <br />
          {'> Astera Titan Tubes for practicals.'}
          <br />
          {'> Matched composition within 5% margin.'}
        </div>
      </div>
    </div>
  );
}

export default PreprodTab;
