export default function DirectorConsoleBody({ vm }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
          <h1 className="text-3xl font-semibold">Director Console</h1>
          <p className="mt-2 text-zinc-400">The console shell is loaded. Hook up the remaining panels as needed.</p>
        </header>
        <pre className="overflow-auto rounded-2xl border border-zinc-800 bg-black/40 p-4 text-xs text-zinc-300">
          {JSON.stringify({ activeTab: vm.activeTab, isAuthenticated: vm.isAuthenticated }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
