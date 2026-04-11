import { useMemo, useState } from 'react';
import { clearRuntimeLogs, getRuntimeLogs } from '../../utils/runtimeDiagnostics.js';

function HealthCheck() {
  const [refreshToken, setRefreshToken] = useState(0);

  const logs = useMemo(() => getRuntimeLogs(), [refreshToken]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100 md:px-10">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
        <h1 className="text-xl tracking-[0.08em] text-zinc-100 md:text-2xl">Mobile Health Check</h1>
        <p className="mt-2 text-sm text-zinc-400">用于快速排查手机端打不开/白屏问题。</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
            <p className="text-zinc-400">Current URL</p>
            <p className="mt-1 break-all text-zinc-200">{typeof window !== 'undefined' ? window.location.href : ''}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
            <p className="text-zinc-400">User Agent</p>
            <p className="mt-1 break-all text-zinc-200">{typeof window !== 'undefined' ? window.navigator.userAgent : ''}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshToken((v) => v + 1)}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs text-zinc-200"
          >
            Refresh Logs
          </button>
          <button
            type="button"
            onClick={() => {
              clearRuntimeLogs();
              setRefreshToken((v) => v + 1);
            }}
            className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs text-rose-200"
          >
            Clear Logs
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs tracking-[0.12em] text-zinc-400">RUNTIME LOGS</p>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2">
                  <p className="text-[11px] text-cyan-300">{log.type}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">{new Date(log.timestamp).toLocaleString()}</p>
                  <pre className="mt-2 overflow-x-auto text-[11px] text-zinc-300">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No logs yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default HealthCheck;
