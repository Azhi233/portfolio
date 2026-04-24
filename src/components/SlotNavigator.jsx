export default function SlotNavigator({ groups, activeId, onJump }) {
  return (
    <aside className="sticky top-6 rounded-[1.75rem] border border-[#1b171420] bg-[#f8f4ee] p-4 shadow-[0_12px_40px_rgba(30,20,10,0.08)]">
      <p className="text-[11px] tracking-[0.28em] text-[#8b7768]">SECTIONS</p>
      <div className="mt-4 grid gap-2">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="rounded-2xl border border-[#1b17141f] bg-white p-3">
            <p className="text-xs font-medium tracking-[0.18em] text-[#16110d]">{group}</p>
            <div className="mt-2 grid gap-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onJump(item.id)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${activeId === item.id ? 'bg-[#1b1714] text-white' : 'bg-transparent text-[#5e5248] hover:bg-black/5'}`}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="ml-2 flex items-center gap-2 text-[10px] tracking-[0.14em] opacity-70">
                    {item.enabled === false ? <span>OFF</span> : null}
                    <span className="cursor-grab">⠿</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
